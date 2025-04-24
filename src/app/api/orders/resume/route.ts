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
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // First query to get the actual value of previousStatus directly from the database
    const result = await prisma.$queryRaw`
      SELECT "previousStatus" FROM "orders" WHERE "id" = ${orderId}
    `;
    
    console.log("Raw previousStatus query result:", result);
    
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
    
    console.log("Order before resume:", {
      id: order.id,
      status: order.status,
      previousStatus: (order as any).previousStatus,
      holdReason: (order as any).holdReason
    });
    
    // Check if order is actually on hold
    if (order.status !== "ON_HOLD") {
      return NextResponse.json(
        { error: "Can only resume orders that are on hold" },
        { status: 400 }
      );
    }
    
    // Get the previousStatus from the raw query result
    let previousStatus = "PENDING";
    
    if (result && Array.isArray(result) && result[0] && (result[0] as any).previousStatus) {
      previousStatus = (result[0] as any).previousStatus;
      console.log("Using previousStatus from database:", previousStatus);
    } else if ((order as any).previousStatus) {
      previousStatus = (order as any).previousStatus;
      console.log("Using previousStatus from order object:", previousStatus);
    } else {
      console.log("No previousStatus found, using default:", previousStatus);
    }
    
    // Update using Prisma's executeRawUnsafe which allows more direct SQL control
    await prisma.$executeRawUnsafe(`
      UPDATE "orders"
      SET "status" = '${previousStatus}',
          "previousStatus" = NULL,
          "holdReason" = NULL
      WHERE "id" = '${orderId}'
    `);
    
    // Fetch the updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    
    console.log("Order after resume:", {
      id: updatedOrder?.id,
      status: updatedOrder?.status,
      previousStatus: updatedOrder ? (updatedOrder as any).previousStatus : null,
      holdReason: updatedOrder ? (updatedOrder as any).holdReason : null
    });
    
    // Log the action without using raw SQL since it's causing issues
    try {
      await (prisma as any).orderLog.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          userId: session.user.id,
          action: "RESUME",
          notes: `Order resumed by ${session.user.name || session.user.email}. Status restored to ${previousStatus}`
        }
      });
    } catch (logError) {
      console.error("Error creating order log:", logError);
      // Continue without failing the whole request if logging fails
    }
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: `Order has been resumed and status restored to ${previousStatus}`
    });
    
  } catch (error) {
    console.error("Error resuming order:", error);
    return NextResponse.json(
      { error: "Failed to resume order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 