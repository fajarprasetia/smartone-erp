import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper function to serialize data (handle BigInt)
function serializeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
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
    
    // Update order status to ON_HOLD and store previous status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "ON_HOLD",
        previousStatus: order.status, // Store current status for resuming later
        holdReason: holdReason
      },
      include: { customer: true }
    });
    
    // Log the hold action
    await prisma.orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "HOLD",
        notes: `Order put on hold by ${session.user.name || session.user.email}. Reason: ${holdReason}`
      }
    });
    
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