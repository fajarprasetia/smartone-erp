import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to serialize data (handle BigInt)
function serializeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { orderId, holdReason } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    if (!holdReason) {
      return NextResponse.json(
        { error: "Hold reason is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Check if order is already on hold
    if (order.status === "ON_HOLD") {
      return NextResponse.json(
        { error: "Order is already on hold" },
        { status: 400 }
      );
    }
    
    // Check if order can be put on hold (not CANCELLED, COMPLETED, or DELIVERED)
    if (["CANCELLED", "COMPLETED", "DELIVERED"].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot put a ${order.status} order on hold` },
        { status: 400 }
      );
    }
    
    // Store the current status for debugging
    console.log("Current order status before hold:", order.status);
    
    // Use direct database query to update the order fields
    // Ensure we have a valid status to save as previousStatus
    const currentStatus = order.status || "PENDING"; // Use a fallback status if null
    
    console.log("Saving previousStatus as:", currentStatus);
    
    // Double check in the database if the column exists
    try {
      const columnExists = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'previousStatus'
      `;
      console.log("previousStatus column check:", columnExists);
    } catch (e) {
      console.error("Error checking column:", e);
    }
    
    // Update using Prisma's executeRawUnsafe which allows more direct SQL control
    await prisma.$executeRawUnsafe(`
      UPDATE "orders"
      SET "status" = 'ON_HOLD',
          "previousStatus" = '${currentStatus}',
          "holdReason" = '${holdReason.replace(/'/g, "''")}'
      WHERE "id" = '${orderId}'
    `);
    
    // Verify the update worked
    const verifyUpdate = await prisma.$queryRaw`
      SELECT "status", "previousStatus", "holdReason" 
      FROM "orders" 
      WHERE "id" = ${orderId}
    `;
    console.log("Verification after hold update:", verifyUpdate);
    
    // Fetch the updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    
    console.log("Order after update:", {
      id: updatedOrder.id,
      status: updatedOrder.status,
      previousStatus: updatedOrder.previousStatus,
      holdReason: updatedOrder.holdReason
    });
    
    // Log the action without using raw SQL since it's causing issues
    try {
      await prisma.orderLog.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          userId: session.user.id,
          action: "HOLD",
          notes: `Order put on hold by ${session.user.name || session.user.email}. Reason: ${holdReason}. Previous status: ${currentStatus}`
        }
      });
    } catch (logError) {
      console.error("Error creating order log:", logError);
      // Continue without failing the whole request if logging fails
    }
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been put on hold"
    });
    
  } catch (error) {
    console.error("Error putting order on hold:", error);
    return NextResponse.json(
      { error: "Failed to put order on hold", details: (error as Error).message },
      { status: 500 }
    );
  }
} 