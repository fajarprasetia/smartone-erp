import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function to serialize data (handle BigInt)
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET: Fetch a specific order for editing in the pending tab
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("API: Pending order route called for ID:", params.id);
    
    // Get auth session using getServerSession instead of auth()
    const session = await getServerSession(authOptions);
    console.log("API: Auth session obtained:", session ? "Yes" : "No");
    
    // Check if user is authenticated
    if (!session?.user) {
      console.log("API: Unauthorized - no session user");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    console.log("API: Fetching pending order with ID:", id);
    
    if (!id) {
      console.log("API: No order ID provided");
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    try {
      // First, attempt to find the order using the ID as is (string format)
      console.log("API: Attempting to find order with string ID");
      let order = await db.order.findUnique({
        where: {
          id: id,
        },
        include: {
          customer: true,
          asal_bahan_rel: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          designer: {
            select: {
              id: true,
              name: true,
            },
          },
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      // If not found and ID looks like it could be a numeric value, try with different approaches
      if (!order && /^\d+$/.test(id)) {
        console.log("API: Order not found with string ID, trying numeric ID methods");
        
        // Try to find by SPK if it's a numeric value
        order = await db.order.findFirst({
          where: {
            spk: id,
          },
          include: {
            customer: true,
            asal_bahan_rel: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            designer: {
              select: {
                id: true,
                name: true,
              },
            },
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
      
      // If still not found, try NOSPK field
      if (!order && /^\d+$/.test(id)) {
        console.log("API: Order still not found, trying NOSPK field");
        
        order = await db.order.findFirst({
          where: {
            nospk: parseInt(id, 10)
          },
          include: {
            customer: true,
            asal_bahan_rel: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            designer: {
              select: {
                id: true,
                name: true,
              },
            },
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
      
      console.log("API: Order found:", order ? "Yes" : "No");
      
      if (!order) {
        console.log("API: Order not found for ID:", id);
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
      
      // Process marketing field to determine if it's a user ID or plain string
      let marketingInfo = null;
      
      if (order.marketing) {
        try {
          // Try to interpret the marketing field as a user ID
          const user = await db.user.findUnique({
            where: { id: order.marketing },
            select: { id: true, name: true, email: true }
          });
          
          if (user) {
            marketingInfo = {
              id: user.id,
              name: user.name,
              email: user.email
            };
          } else {
            // Fallback: treat marketing as a plain string if not a valid user ID
            marketingInfo = { name: order.marketing };
          }
        } catch (error) {
          console.error('API: Error fetching marketing user:', error);
          // Fallback to using the marketing field as a name
          marketingInfo = { name: order.marketing };
        }
      }
      
      // Format dates properly for the client
      const formattedOrder = {
        ...order,
        // Convert BigInt or other non-serializable types to string
        id: String(order.id),
        customer_id: order.customerId ? String(order.customerId) : null,
        asal_bahan_id: (order as any).asal_bahan_id ? String((order as any).asal_bahan_id) : null,
        // Add marketing info
        marketingInfo,
        // Format dates
        created_at: order.created_at?.toISOString() || null,
        updated_at: order.updated_at?.toISOString() || null,
        tanggal: order.tanggal?.toISOString() || null,
        est_order: order.est_order?.toISOString() || null,
        tgl_dp: order.tgl_dp?.toISOString() || null,
        tgl_lunas: order.tgl_lunas?.toISOString() || null,
        tgl_invoice: order.tgl_invoice?.toISOString() || null,
        tgl_app_cs: order.tgl_app_cs?.toISOString() || null,
        tgl_app_prod: order.tgl_app_prod?.toISOString() || null,
        tgl_app_manager: order.tgl_app_manager?.toISOString() || null,
        tgl_print: order.tgl_print?.toISOString() || null,
        tgl_cutting: order.tgl_cutting?.toISOString() || null,
        tgl_dtf: order.tgl_dtf?.toISOString() || null,
        tgl_press: order.tgl_press?.toISOString() || null,
        waktu_rip: order.waktu_rip?.toISOString() || null,
        cutting_done: order.cutting_done?.toISOString() || null,
        dtf_done: order.dtf_done?.toISOString() || null,
        press_done: order.press_done?.toISOString() || null,
        print_done: order.print_done?.toISOString() || null,
      };
      
      // Format customer data if available
      if (order.customer) {
        formattedOrder.customer = {
          ...order.customer,
          id: String(order.customer.id)
        } as any;
      }
      
      console.log("API: Successfully formatted order data");
      // Use serializeData to handle any remaining BigInt values
      return NextResponse.json(serializeData(formattedOrder));
    } catch (dbError) {
      console.error("API: Database error:", dbError);
      // Print the entire error object for debugging
      console.error("API: Full database error:", JSON.stringify(dbError, null, 2));
      return NextResponse.json(
        { 
          error: "Database error while fetching order",
          details: dbError instanceof Error ? dbError.message : String(dbError),
          context: {
            id: id,
            idType: typeof id,
            errorName: dbError instanceof Error ? dbError.name : 'Unknown',
          }
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("API: Error fetching pending order:", error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: "Failed to fetch pending order",
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
} 