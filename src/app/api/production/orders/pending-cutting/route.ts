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
    // Allow for a much higher limit with a higher default to effectively remove pagination
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "1000");
    // Skip calculation remains the same for compatibility
    const skip = (page - 1) * limit;

    // Define a simpler query approach to avoid type issues
    const whereCondition = {
      // Common conditions
      cutting_id: null,
      tgl_cutting: null,
      
      // Status must be either "CUTTING READY" or "PRESS DONE"
      status: {
        in: ["CUTTING READY", "PRESS DONE"]
      }
      
      // If status is "PRESS DONE", then product must contain "CUTTING"
      // This is handled in code below for "PRESS DONE" status
      
      // Not in these statuses (this is redundant with the in condition above and may cause issues)
      // NOT: {
      //   status: {
      //     in: ["DRAFT", "CANCELLED", "COMPLETED"]
      //   }
      // }
    };

    // Get count of total records for pagination
    const totalCount = await prisma.order.count({
      where: whereCondition
    });

    // Fetch orders based on the defined conditions
    const pendingCuttingOrders = await prisma.order.findMany({
      where: whereCondition,
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

    // Check if the specific example order is in the database results
    const exampleOrderId = "cm9us26do00013ipolpx7vqeg";
    const exampleOrder = pendingCuttingOrders.find(order => order.id === exampleOrderId);
    if (exampleOrder) {
      console.log("Example order found in database results:", {
        id: exampleOrder.id,
        spk: exampleOrder.spk,
        status: exampleOrder.status,
        cutting_id: exampleOrder.cutting_id,
        tgl_cutting: exampleOrder.tgl_cutting,
        produk: exampleOrder.produk
      });
    } else {
      console.log("Example order NOT found in database results. Checking if it exists at all...");
      
      // Check if the order exists in the database
      try {
        const orderCheck = await prisma.order.findUnique({
          where: { id: exampleOrderId },
          select: { 
            id: true, 
            spk: true, 
            status: true, 
            cutting_id: true, 
            tgl_cutting: true, 
            produk: true 
          }
        });
        
        if (orderCheck) {
          console.log("Example order exists in database but wasn't returned by our query:", orderCheck);
          
          // Check if it matches our where condition but might be missed due to pagination
          // Try a focused query just for this order with the same conditions
          const specificOrderCheck = await prisma.order.findMany({
            where: {
              id: exampleOrderId,
              // Common conditions
              cutting_id: null,
              tgl_cutting: null,
              // Status must be either "CUTTING READY" or "PRESS DONE"
              status: {
                in: ["CUTTING READY", "PRESS DONE"]
              }
            }
          });
          
          if (specificOrderCheck.length > 0) {
            console.log("Example order matches our criteria but might be missed due to pagination:", specificOrderCheck[0]);
          } else {
            console.log("Example order doesn't match our WHERE conditions! Detailed order:", orderCheck);
          }
        } else {
          console.log("Example order doesn't exist in the database with ID:", exampleOrderId);
        }
      } catch (error) {
        console.error("Error checking for example order:", error);
      }
    }

    console.log(`Database query returned ${pendingCuttingOrders.length} orders`);
    
    // Log the statuses of orders returned from database
    const statusCounts = pendingCuttingOrders.reduce((acc, order) => {
      const status = order.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("Status distribution in DB results:", JSON.stringify(statusCounts));

    // Filter out "PRESS DONE" status orders that don't have "CUTTING" in the product name
    const filteredOrders = pendingCuttingOrders.filter(order => {
      const status = (order.status || "").toUpperCase();
      const productName = (order.produk || "").toUpperCase();
      
      return (
        // Condition 1: Status is "CUTTING READY"
        status === "CUTTING READY" || 
        // Condition 2: Status is "PRESS DONE" and product contains "CUTTING"
        (status === "PRESS DONE" && productName.includes("CUTTING"))
      );
    });

    // Log the statuses after JavaScript filtering
    const filteredStatusCounts = filteredOrders.reduce((acc, order) => {
      const status = order.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("Status distribution after filtering:", JSON.stringify(filteredStatusCounts));
    console.log(`Found ${totalCount} pending cutting orders (showing ${filteredOrders.length} from page ${page})`);

    // Transform the data to match the Order interface
    const formattedOrders = filteredOrders.map(order => ({
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