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
      return data.toString();
    }
    
    if (data instanceof Date) {
      return data.toISOString();
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
      console.log("Pending Print List API called");
      
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
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
      const sortField = url.searchParams.get("sortField") || "created_at";
      const sortOrder = url.searchParams.get("sortOrder") || "desc";
      const searchQuery = url.searchParams.get("search") || "";
      
      console.log(`Query params: page=${page}, pageSize=${pageSize}, sort=${sortField}:${sortOrder}, search="${searchQuery}"`);
      
      // Build filter for pending print orders
      let whereCondition: any = {
        status: "READYFORPROD",
        tgl_print: null
      };
      
      // Add search query if provided
      if (searchQuery) {
        whereCondition.OR = [
          { spk: { contains: searchQuery, mode: "insensitive" } },
          { produk: { contains: searchQuery, mode: "insensitive" } },
          { nama_produk: { contains: searchQuery, mode: "insensitive" } },
          { catatan: { contains: searchQuery, mode: "insensitive" } },
          { customer: { nama: { contains: searchQuery, mode: "insensitive" } } }
        ];
      }
      
      // Count total matching orders (for pagination)
      const totalCount = await db.order.count({
        where: whereCondition
      });
      
      console.log(`Found ${totalCount} total pending print orders`);
      
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
      
      console.log(`Fetched ${orders.length} pending print orders for page ${validPage}`);

      // Fetch marketing users for the orders
      const marketingIds = orders
        .filter(order => order.marketing)
        .map(order => order.marketing);
      
      let marketingUsers: Record<string, string> = {};
      
      if (marketingIds.length > 0) {
        try {
          const users = await db.user.findMany({
            where: {
              id: {
                in: marketingIds.filter((id): id is string => id !== null)
              }
            },
            select: {
              id: true,
              name: true
            }
          });
          
          marketingUsers = users.reduce((acc: Record<string, string>, user) => {
            acc[user.id] = user.name;
            return acc;
          }, {});
          
          console.log(`Found ${users.length} marketing users`);
        } catch (error) {
          console.error("Error fetching marketing users:", error);
        }
      }
      
      // Fetch designer users for the orders
      const designerIds = orders
        .filter(order => order.designer_id)
        .map(order => order.designer_id)
        .filter((id, idx, arr) => id && arr.indexOf(id) === idx);
      let designerUsers: Record<string, string> = {};
      if (designerIds.length > 0) {
        try {
          const users = await db.user.findMany({
            where: {
              id: {
                in: designerIds.filter((id): id is string => id !== null)
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
      console.error("Error in pending print orders API:", error);
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to fetch pending print orders",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
}