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
    
    // Enhanced debug information to track request
    console.log(`[Order ID API] Request received with ID: ${id}, URL: ${req.url}`);
    
    if (!id) {
      console.log(`[Order ID API] No ID provided`);
      return NextResponse.json({ 
        error: "ID parameter is required",
        details: "The 'id' query parameter must be included in the request" 
      }, { status: 400 });
    }
    
    // Try to parse as numeric
    if (!/^\d+$/.test(id)) {
      console.log(`[Order ID API] ID is not numeric: ${id}`);
      return NextResponse.json({ 
        error: "ID must be numeric",
        details: `The provided ID '${id}' is not a valid numeric value`
      }, { status: 400 });
    }
    
    const numericId = parseInt(id, 10);
    console.log(`[Order ID API] Searching for order with numeric ID: ${numericId}`);
    
    // First attempt: Direct database numeric ID match
    try {
      // Try to get order ID from the raw query
      console.log(`[Order ID API] Attempt 1: Looking up by direct ID match in database`);
      const rawOrder = await prisma.$queryRaw`
        SELECT id FROM orders WHERE id = ${id} LIMIT 1
      `;
      
      console.log(`[Order ID API] Raw query result:`, rawOrder);
      
      if (Array.isArray(rawOrder) && rawOrder.length > 0) {
        const orderId = rawOrder[0].id;
        console.log(`[Order ID API] Found order with ID: ${orderId}`);
        
        // Get the full order with customer
        console.log(`[Order ID API] Fetching complete order data for ID: ${orderId}`);
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            customer: true,
            asal_bahan_rel: true 
          }
        });
        
        if (order) {
          console.log(`[Order ID API] Successfully retrieved order data`);
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
        } else {
          console.log(`[Order ID API] Order with ID ${orderId} not found during detailed fetch`);
        }
      } else {
        console.log(`[Order ID API] No order found with direct ID match: ${id}`);
      }
      
      // If not found by direct ID, try the nospk field
      console.log(`[Order ID API] Attempt 2: Checking nospk field with value ${numericId}`);
      const nospkOrder = await prisma.$queryRaw`
        SELECT id FROM orders WHERE nospk = ${numericId} LIMIT 1
      `;
      
      console.log(`[Order ID API] nospk query result:`, nospkOrder);
      
      if (Array.isArray(nospkOrder) && nospkOrder.length > 0) {
        const orderId = nospkOrder[0].id;
        console.log(`[Order ID API] Found order by nospk with ID: ${orderId}`);
        
        // Get the full order with customer
        console.log(`[Order ID API] Fetching complete order data for nospk match with ID: ${orderId}`);
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            customer: true,
            asal_bahan_rel: true 
          }
        });
        
        if (order) {
          console.log(`[Order ID API] Successfully retrieved order data from nospk match`);
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
        } else {
          console.log(`[Order ID API] Order with nospk ${numericId} not found during detailed fetch`);
        }
      } else {
        console.log(`[Order ID API] No order found with nospk match: ${numericId}`);
      }
      
      // If still not found, try SPK field that might contain this number
      console.log(`[Order ID API] Attempt 3: Checking SPK field for numeric matches with ${id}`);
      const spkOrder = await prisma.$queryRaw`
        SELECT id FROM orders 
        WHERE 
          spk LIKE ${`%${id}`} OR
          spk LIKE ${`%${id}%`}
        LIMIT 1
      `;
      
      console.log(`[Order ID API] SPK query result:`, spkOrder);
      
      if (Array.isArray(spkOrder) && spkOrder.length > 0) {
        const orderId = spkOrder[0].id;
        console.log(`[Order ID API] Found order by spk numeric match with ID: ${orderId}`);
        
        // Get the full order with customer
        console.log(`[Order ID API] Fetching complete order data for spk match with ID: ${orderId}`);
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            customer: true,
            asal_bahan_rel: true 
          }
        });
        
        if (order) {
          console.log(`[Order ID API] Successfully retrieved order data from spk match`);
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
        } else {
          console.log(`[Order ID API] Order with spk containing ${id} not found during detailed fetch`);
        }
      } else {
        console.log(`[Order ID API] No order found with spk containing: ${id}`);
      }
      
      // If we reach here, no order was found through any method
      console.log(`[Order ID API] No order found through any lookup method for ID: ${id}`);
      return NextResponse.json(
        { 
          error: "Order not found", 
          details: `No order found with direct ID ${id}, nospk ${numericId}, or spk containing ${id}`
        }, 
        { status: 404 }
      );
    } catch (dbError) {
      console.error('[Order ID API] Database error during order lookup:', dbError);
      
      // Return a more detailed error response
      return NextResponse.json(
        { 
          error: "Database error while searching for order",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Order ID API] Unhandled error in order lookup endpoint:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: "Failed to process order lookup request",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 