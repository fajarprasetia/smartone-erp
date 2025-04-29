import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          return null; // Invalid date
        }
        return value.toISOString(); // Return as ISO string
      }
      
      return value;
    })
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get pagination parameters from query string
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Define the query conditions for in-progress cutting orders
    const whereCondition = {
      // Orders with status exactly "CUTTING"
      status: "CUTTING",
      
      // Must have started cutting (assigned an operator and have a start date)
      cutting_id: { 
        not: null 
      },
      tgl_cutting: { 
        not: null 
      },
      
      // But not completed yet
      cutting_done: null,
    };

    // Get count of total records for pagination
    const totalCount = await prisma.order.count({
      where: whereCondition
    });

    // Fetch orders based on the defined conditions
    const cuttingInProgressOrders = await prisma.order.findMany({
      where: whereCondition,
      orderBy: [
        // High priority orders first
        { prioritas: "desc" },
        // Then by cutting start date (newest first to show most recently started)
        { tgl_cutting: "desc" }
      ],
      include: {
        customer: {
          select: {
            nama: true,
          },
        },
        cutting: {
          select: {
            name: true
          }
        }
      },
      // Add pagination
      skip: skip,
      take: limit,
    });

    console.log(`Found ${totalCount} cutting in progress orders (showing ${cuttingInProgressOrders.length} from page ${page})`);

    // Transform the data to match the Order interface
    const formattedOrders = cuttingInProgressOrders.map(order => ({
      id: order.id,
      spk: order.spk || "",
      customerName: order.customer?.nama || "Unknown",
      customerId: order.customerId?.toString() || "",
      productName: order.produk || order.nama_produk || "Unknown",
      quantity: parseInt(order.qty || "0"),
      unit: order.satuan_bahan || "pcs",
      status: order.status || "CUTTING",
      priority: order.prioritas?.toLowerCase() || "low",
      cuttingStartedAt: order.tgl_cutting?.toISOString() || null,
      cuttingAssignee: order.cutting?.name || "",
      cuttingNotes: order.catatan_cutting || "",
      createdAt: order.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: order.updated_at?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      orders: serializeData(formattedOrders),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching cutting in progress orders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 