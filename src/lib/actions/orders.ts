import { db } from "@/lib/db";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

/**
 * Get a single order by ID with all related data
 */
export async function getOrderById(orderId: string) {
  try {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Fetch the order by ID
    const order = await db.order.findUnique({
      where: {
        id: orderId,
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

    if (!order) {
      return null;
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
        // Fallback to using the marketing field as a name
        marketingInfo = { name: order.marketing };
      }
    }

    // Format and return the order with all fields properly serialized
    return serializeData({
      ...order,
      marketingInfo,
    });
  } catch (error: any) {
    console.error("Error fetching order by ID:", error);
    throw new Error(`Failed to fetch order: ${error.message || "Unknown error occurred"}`);
  }
} 