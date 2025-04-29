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
    const { orderId, cancellationReason } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    if (!cancellationReason) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
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
    
    // Check if order is already canceled
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      );
    }
    
    // Check if order is in a state that can be cancelled
    // Usually completed orders shouldn't be cancelled
    if (order.status === "COMPLETED" || order.status === "DELIVERED") {
      return NextResponse.json(
        { error: `Cannot cancel an order that is ${order.status.toLowerCase()}` },
        { status: 400 }
      );
    }
    
    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "CANCELLED",
        statusm: `Previous status: ${order.status}`,
        catatan: cancellationReason
      },
      include: { customer: true }
    });
    
    // Skip log creation for now as it's causing errors
    /* 
    await prisma.OrderLog.create({
      data: {
        id: crypto.randomUUID(),
        orderId,
        userId: session.user.id,
        action: "CANCEL",
        notes: `Order cancelled by ${session.user.name || session.user.email}. Reason: ${cancellationReason}`
      }
    });
    */
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been cancelled"
    });
    
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 