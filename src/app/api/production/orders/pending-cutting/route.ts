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

    // Get count of total records for pagination
    const totalCount = await prisma.order.count({
      where: {
        cutting_id: null,
        tgl_cutting: null,
        status: {
          notIn: ["DRAFT", "CANCELLED", "COMPLETED"],
        },
        produk: {
          contains: "CUTTING",
          mode: "insensitive",
        },
      }
    });

    // Fetch orders that have the CUTTING process and are in a state ready for cutting
    // This means they haven't been assigned to cutting yet
    const pendingCuttingOrders = await prisma.order.findMany({
      where: {
        // Orders that haven't started cutting process yet
        cutting_id: null,
        tgl_cutting: null,
        // Include only orders that are in active production
        // Adjust the status conditions based on your workflow
        status: {
          notIn: ["DRAFT", "CANCELLED", "COMPLETED"],
        },
        // Must contain "CUTTING" in the product name
        produk: {
          contains: "CUTTING",
          mode: "insensitive",
        },
      },
      orderBy: [
        // High priority orders first
        { prioritas: "desc" },
        // Then by creation date (newest first)
        { created_at: "desc" }
      ],
      include: {
        customer: {
          select: {
            nama: true,
          },
        },
      },
      // Add pagination
      skip: skip,
      take: limit,
    });

    console.log(`Found ${totalCount} pending cutting orders (showing ${pendingCuttingOrders.length} from page ${page})`);

    // Transform the data to match the Order interface
    const formattedOrders = pendingCuttingOrders.map(order => ({
      id: order.id,
      spk: order.spk || "",
      customerName: order.customer?.nama || "Unknown",
      customerId: order.customerId?.toString() || "",
      productName: order.produk || order.nama_produk || "Unknown",
      quantity: parseInt(order.qty || "0"),
      unit: order.satuan_bahan || "pcs",
      status: order.status || "PENDING",
      priority: order.prioritas?.toLowerCase() || "low",
      createdAt: order.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: order.updated_at?.toISOString() || new Date().toISOString(),
      notes: order.catatan || "",
      targetCompletionDate: order.est_order?.toISOString() || null,
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
    console.error("Error fetching pending cutting orders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 