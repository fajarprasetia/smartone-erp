import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

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
  export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const decodedId = decodeURIComponent(id);
    
    console.log('Processing approval for order:', decodedId);
    
    if (!decodedId) {
      return new NextResponse(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Finding order with ID:', decodedId);
    const order = await db.order.findUnique({
      where: { id: decodedId },
    });

    if (!order) {
      console.log('Order not found:', decodedId);
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Found order:', order.id);

    const body = await req.json();

    // Update order based on user role and request body
    let updateData = {};
    if (session.user.role?.name === "Manager") {
      updateData = {
        approval_mng: body.approval_mng || "APPROVED",
        manager_id: session.user.id,
        tgl_app_manager: new Date(body.tgl_app_manager || Date.now())
      };
    } else if (session.user.role?.name === "Operation Manager") {
      updateData = {
        approval_opr: body.approval_opr || "APPROVED",
        opr_id: session.user.id,
        tgl_app_prod: new Date(body.tgl_app_prod || Date.now())
      };
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized role" }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating order with data:', updateData);
    
    try {
      const updatedOrder = await db.order.update({
        where: { id: decodedId },
        data: updateData
      });
      
      console.log('Successfully updated order:', updatedOrder.id);

      return new NextResponse(
        JSON.stringify(bigIntSerializer(updatedOrder)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error('Database error during order update:', dbError);
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to update order in database',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error updating approval status:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to update approval status",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: Request) {
    try {
      console.log("Approval List API called");
      
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
      
      if (filterType === "Approval" || filterType === "READYFORPROD") {
        whereCondition.status = "READYFORPROD";
        whereCondition.approval = "APPROVED";
        whereCondition.OR = [
          { dp: { not: null } },
          { biaya_tambahan: { not: null } }
        ];
      }
      
      // Add search query if provided
      if (searchQuery) {
        const searchOR = [
          { spk: { contains: searchQuery, mode: "insensitive" } },
          { produk: { contains: searchQuery, mode: "insensitive" } },
          { nama_produk: { contains: searchQuery, mode: "insensitive" } },
          { catatan: { contains: searchQuery, mode: "insensitive" } },
          { customer: { nama: { contains: searchQuery, mode: "insensitive" } } }
        ];
        if (whereCondition.OR) {
          // Combine existing OR with search OR using AND
          whereCondition.AND = [
            { OR: whereCondition.OR },
            { OR: searchOR }
          ];
          delete whereCondition.OR;
        } else {
          whereCondition.OR = searchOR;
        }
      }
      
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

      // Fetch marketing users for the orders
      const marketingIds = orders
        .filter(order => order.marketing)
        .map(order => order.marketing)
        .filter(Boolean) as string[];
      
      let marketingUsers: Record<string, string> = {};
      
      if (marketingIds.length > 0) {
        try {
          // Fetch marketing users from the User table
          const users = await db.user.findMany({
            where: {
              id: {
                in: marketingIds
              }
            },
            select: {
              id: true,
              name: true
            }
          });
          
          // Create a lookup map of user IDs to names
          marketingUsers = users.reduce((acc: Record<string, string>, user) => {
            acc[user.id] = user.name;
            return acc;
          }, {});
          
          console.log(`Found ${users.length} marketing users`);
        } catch (error) {
          console.error("Error fetching marketing users:", error);
          // Continue without marketing user data
        }
      }
      
      // Fetch designer users for the orders
      const designerIds = orders
        .filter(order => order.designer_id)
        .map(order => order.designer_id)
        .filter(Boolean) as string[]; // Filter out nulls
      let designerUsers: Record<string, string> = {};
      if (designerIds.length > 0) {
        try {
          const users = await db.user.findMany({
            where: {
              id: {
                in: designerIds
              }
            },
            select: {
              id: true,
              name: true
            }
          });
          designerUsers = users.reduce((acc: Record<string, string>, user) => {
            acc[user.id] = user.name;
            return acc;
          }, {});
          console.log(`Found ${users.length} designer users`);
        } catch (error) {
          console.error("Error fetching designer users:", error);
        }
      }
      
      const modifiedOrders = orders.map(order => ({
        ...order,
        asal_bahan: order.asal_bahan_id === BigInt(22) ? 'SMARTONE' : 'CUSTOMER',
        marketing: order.marketing
          ? { id: order.marketing, name: marketingUsers[order.marketing] || order.marketing }
          : null,
        designer_id: order.designer_id
          ? { id: order.designer_id, name: designerUsers[order.designer_id] || order.designer_id }
          : null
      }));

      const serializedData = bigIntSerializer({
        orders: modifiedOrders,
        totalCount: totalCount,
        totalPages: totalPages,
        currentPage: validPage
      });

      return new NextResponse(
        JSON.stringify(serializedData),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      console.error("Error in Approval orders API:", error);
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to fetch Approval orders",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
}