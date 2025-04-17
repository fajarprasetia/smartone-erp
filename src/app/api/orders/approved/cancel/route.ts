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
    
    // Parse request body to get orderId and cancellation reason
    const { orderId, cancellationReason } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists and is in APPROVED status
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
    
    if (order.status !== "APPROVED") {
      return NextResponse.json(
        { error: `Order is not in APPROVED status. Current status: ${order.status}` },
        { status: 400 }
      );
    }
    
    // Check if production has already started
    const productionStarted = await prisma.production.findFirst({
      where: { 
        orderId: orderId,
        status: { notIn: ['PENDING', 'REJECTED'] }  
      }
    });
    
    if (productionStarted) {
      return NextResponse.json(
        { error: "Cannot cancel order because production has already started" },
        { status: 400 }
      );
    }
    
    // Update order status to CANCELED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "CANCELED",
        canceledBy: session.user.id,
        canceledAt: new Date(),
        cancellationReason: cancellationReason || "No reason provided"
      },
      include: { customer: true }
    });
    
    // Log the cancellation action
    await prisma.orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "CANCELED",
        notes: cancellationReason 
          ? `Order canceled by ${session.user.name || session.user.email}. Reason: ${cancellationReason}`
          : `Order canceled by ${session.user.name || session.user.email}`
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been canceled successfully"
    });
    
  } catch (error) {
    console.error("Error canceling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 