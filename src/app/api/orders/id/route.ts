import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET: Endpoint specifically for fetching orders by numeric ID
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    // Debug information to track request
    console.log(`[Order ID API] Request received with ID: ${id}`);
    
    if (!id) {
      console.log(`[Order ID API] No ID provided`);
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }
    
    // Try to parse as numeric
    if (!/^\d+$/.test(id)) {
      console.log(`[Order ID API] ID is not numeric: ${id}`);
      return NextResponse.json({ error: "ID must be numeric" }, { status: 400 });
    }
    
    const numericId = parseInt(id, 10);
    console.log(`[Order ID API] Searching for order with numeric ID: ${numericId}`);
    
    // First attempt: Direct database numeric ID match
    try {
      // Try to get order ID from the raw query
      const rawOrder = await prisma.$queryRaw`
        SELECT id FROM orders WHERE id = ${id} LIMIT 1
      `;
      
      if (Array.isArray(rawOrder) && rawOrder.length > 0) {
        const orderId = rawOrder[0].id;
        console.log(`[Order ID API] Found order with ID: ${orderId}`);
        
        // Get the full order with customer
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            customer: true,
            asal_bahan_rel: true 
          }
        });
        
        if (order) {
          // Process order to include marketing info
          let marketingUser = null;
          if (order.marketing) {
            try {
              // Try to interpret the marketing field as a user ID
              const user = await prisma.user.findUnique({
                where: { id: order.marketing },
                select: { id: true, name: true, email: true }
              });
              
              if (user) {
                marketingUser = {
                  id: user.id,
                  name: user.name,
                  email: user.email
                };
              } else {
                // Fallback: treat marketing as a plain string if not a valid user ID
                marketingUser = { name: order.marketing };
              }
            } catch (error) {
              console.error('[Order ID API] Error fetching marketing user:', error);
              // Fallback to using the marketing field as a name
              marketingUser = { name: order.marketing };
            }
          }

          const processedOrder = {
            ...order,
            marketingUser,
            marketingInfo: marketingUser || (order.marketing ? { name: order.marketing } : null)
          };

          return NextResponse.json(serializeData(processedOrder));
        }
      }
      
      // If not found by direct ID, try the nospk field
      console.log(`[Order ID API] Not found by direct ID, checking nospk field`);
      const nospkOrder = await prisma.$queryRaw`
        SELECT id FROM orders WHERE nospk = ${numericId} LIMIT 1
      `;
      
      if (Array.isArray(nospkOrder) && nospkOrder.length > 0) {
        const orderId = nospkOrder[0].id;
        console.log(`[Order ID API] Found order by nospk with ID: ${orderId}`);
        
        // Get the full order with customer
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            customer: true,
            asal_bahan_rel: true 
          }
        });
        
        if (order) {
          // Process order to include marketing info
          let marketingUser = null;
          if (order.marketing) {
            try {
              // Try to interpret the marketing field as a user ID
              const user = await prisma.user.findUnique({
                where: { id: order.marketing },
                select: { id: true, name: true, email: true }
              });
              
              if (user) {
                marketingUser = {
                  id: user.id,
                  name: user.name,
                  email: user.email
                };
              } else {
                // Fallback: treat marketing as a plain string if not a valid user ID
                marketingUser = { name: order.marketing };
              }
            } catch (error) {
              console.error('[Order ID API] Error fetching marketing user:', error);
              // Fallback to using the marketing field as a name
              marketingUser = { name: order.marketing };
            }
          }

          const processedOrder = {
            ...order,
            marketingUser,
            marketingInfo: marketingUser || (order.marketing ? { name: order.marketing } : null)
          };

          return NextResponse.json(serializeData(processedOrder));
        }
      }
      
      // If still not found, try SPK field that might contain this number
      console.log(`[Order ID API] Not found by nospk, checking SPK field for numeric matches`);
      const spkOrder = await prisma.$queryRaw`
        SELECT id FROM orders 
        WHERE 
          spk LIKE ${`%${id}`} OR
          spk LIKE ${`%${id}%`}
        LIMIT 1
      `;
      
      if (Array.isArray(spkOrder) && spkOrder.length > 0) {
        const orderId = spkOrder[0].id;
        console.log(`[Order ID API] Found order by spk numeric match with ID: ${orderId}`);
        
        // Get the full order with customer
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            customer: true,
            asal_bahan_rel: true 
          }
        });
        
        if (order) {
          // Process order to include marketing info
          let marketingUser = null;
          if (order.marketing) {
            try {
              // Try to interpret the marketing field as a user ID
              const user = await prisma.user.findUnique({
                where: { id: order.marketing },
                select: { id: true, name: true, email: true }
              });
              
              if (user) {
                marketingUser = {
                  id: user.id,
                  name: user.name,
                  email: user.email
                };
              } else {
                // Fallback: treat marketing as a plain string if not a valid user ID
                marketingUser = { name: order.marketing };
              }
            } catch (error) {
              console.error('[Order ID API] Error fetching marketing user:', error);
              // Fallback to using the marketing field as a name
              marketingUser = { name: order.marketing };
            }
          }

          const processedOrder = {
            ...order,
            marketingUser,
            marketingInfo: marketingUser || (order.marketing ? { name: order.marketing } : null)
          };

          return NextResponse.json(serializeData(processedOrder));
        }
      }
    } catch (error) {
      console.error(`[Order ID API] Error in direct numeric ID search:`, error);
    }
    
    // If all searches fail, return 404
    console.log(`[Order ID API] Order not found for numeric ID: ${id}`);
    return NextResponse.json(
      { 
        error: "Order not found", 
        details: "No order found matching the provided numeric ID"
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[Order ID API] Error handling numeric ID request:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error.message,
        details: String(error) 
      },
      { status: 500 }
    );
  }
} 