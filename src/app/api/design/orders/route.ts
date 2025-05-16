import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

// Custom serializer for BigInt values
const bigIntSerializer = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string for serialization
  }
  
  if (data instanceof Date) {
    return data.toISOString(); // Properly format Date objects
  }
  
  if (Array.isArray(data)) {
    return data.map(item => bigIntSerializer(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = bigIntSerializer(data[key]);
      }
    }
    return result;
  }
  
  return data;
};

export async function GET(req: Request) {
  try {
    console.log("Design orders API called");
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "exists" : "null");
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Authenticated user:", session.user.id);
    
    // Get query parameters
    const url = new URL(req.url);
    const filterType = url.searchParams.get("filter") || "design"; // design or process
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const sortField = url.searchParams.get("sortField") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const searchQuery = url.searchParams.get("search") || "";
    
    console.log(`Query params: filter=${filterType}, page=${page}, pageSize=${pageSize}, sort=${sortField}:${sortOrder}, search="${searchQuery}"`);
    
    // Build filter based on filterType
    let whereCondition: any = {};
    
    if (filterType === "design") {
      // For "Design Orders" tab: only show orders with statusm = "DESIGN"
      whereCondition = {
        statusm: "DESIGN",
      };
    } else if (filterType === "process") {
      // For "In Process" tab: only show orders assigned to current user with appropriate statusm
      whereCondition = {
        designer_id: session.user.id,
        statusm: {
          in: ["DESIGN PROCESS", "DESIGNED"]
        }
      };
    }
    
    // Add search query if provided
    if (searchQuery) {
      whereCondition = {
        ...whereCondition,
        OR: [
          { spk: { contains: searchQuery, mode: "insensitive" } },
          { 
            customer: {
              nama: { contains: searchQuery, mode: "insensitive" } 
            }
          },
          { produk: { contains: searchQuery, mode: "insensitive" } },
          { nama_produk: { contains: searchQuery, mode: "insensitive" } },
          { catatan: { contains: searchQuery, mode: "insensitive" } },
        ]
      };
    }
    
    try {
      // Count total matching orders (for pagination)
      const totalCount = await db.order.count({
        where: whereCondition
      });
      
      console.log(`Found ${totalCount} total orders matching filter`);
      
      // Calculate total pages
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Validate page number
      const validPage = Math.max(1, Math.min(page, totalPages || 1));
      
      // Determine sort direction
      const sortDirection = sortOrder === "asc" ? "asc" : "desc";
      
      // Fetch orders with pagination, sorting, and includes
      const orders = await db.order.findMany({
        where: whereCondition,
        take: pageSize,
        skip: (validPage - 1) * pageSize,
        orderBy: {
          [sortField]: sortDirection
        },
        include: {
          customer: {
            select: {
              id: true,
              nama: true,
              telp: true
            }
          }
        }
      });
      
      console.log(`Fetched ${orders.length} orders for page ${validPage}`);
      
      // Get designer data for each order if needed
      const orderIds = orders.map(order => order.id);
      let designers: Record<string, { id: string, name: string }> = {};
      
      if (orderIds.length > 0) {
        try {
          // Check if User relation is available for Orders
          const prisma = new PrismaClient();
          const orderModel = prisma.order;
          
          // Get designer data using appropriate relation
          // We'll try a few common relation names
          let designerField = "designer";
          
          // Try to get the designer user data - safely checking what field exists
          const ordersWithDesigners = await db.order.findMany({
            where: {
              id: {
                in: orderIds
              },
              NOT: {
                designer_id: null
              }
            },
            select: {
              id: true,
              designer_id: true
            }
          });
          
          console.log(`Found ${ordersWithDesigners.length} orders with designer IDs`);
          
          // For each order, fetch the corresponding user
          for (const order of ordersWithDesigners) {
            if (order.designer_id) {
              try {
                const user = await db.user.findUnique({
                  where: {
                    id: order.designer_id
                  },
                  select: {
                    id: true,
                    name: true
                  }
                });
                
                if (user && order.id) {
                  designers[order.id] = {
                    id: user.id,
                    name: user.name
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch user for designer_id ${order.designer_id}:`, err);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching designer data:", error);
          // Continue without designer data
        }
      }
      
      console.log(`Fetched designer data for ${Object.keys(designers).length} orders`);
      
      // Transform the data to match the expected format
      const transformedOrders = orders.map(order => {
        const designer = designers[order.id] || null;
        return {
          ...order,
          designer_id: designer
        };
      });
      
      // Process the data to handle BigInt serialization
      const serializedData = bigIntSerializer({
        orders: transformedOrders,
        currentPage: validPage,
        totalPages,
        totalCount
      });
      
      return new NextResponse(
        JSON.stringify(serializedData),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Database error", 
          message: dbError instanceof Error ? dbError.message : "Unknown database error" 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("Error in design orders API:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to fetch design orders",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 