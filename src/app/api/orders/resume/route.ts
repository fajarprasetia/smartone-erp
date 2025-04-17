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
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
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
    
    // Check if order is actually on hold
    if (order.status !== "ON_HOLD") {
      return NextResponse.json(
        { error: "Can only resume orders that are on hold" },
        { status: 400 }
      );
    }
    
    // Check if the order has a previous status saved
    if (!order.previousStatus) {
      return NextResponse.json(
        { error: "Cannot resume order: previous status is not available" },
        { status: 400 }
      );
    }
    
    // Update order status to the previous status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: order.previousStatus,
        previousStatus: null // Clear the previous status field
      },
      include: { customer: true }
    });
    
    // Log the resume action
    await prisma.orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "RESUME",
        notes: `Order resumed by ${session.user.name || session.user.email}. Status restored to ${order.previousStatus}`
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: `Order has been resumed and status restored to ${order.previousStatus}`
    });
    
  } catch (error) {
    console.error("Error resuming order:", error);
    return NextResponse.json(
      { error: "Failed to resume order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 