import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to serialize data (handle BigInt)
function serializeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { orderId, completionNotes } = await request.json();
    
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
    
    // Check if order is already completed or delivered
    if (order.status && ["COMPLETED", "DELIVERED"].includes(order.status)) {
      return NextResponse.json(
        { error: `Order is already ${order.status.toLowerCase()}` },
        { status: 400 }
      );
    }
    
    // Check if order can be completed (not DRAFT, CANCELLED, etc.)
    if (order.status && ["DRAFT", "CANCELLED", "ON_HOLD"].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot mark a ${order.status} order as completed` },
        { status: 400 }
      );
    }
    
    // Update order status to COMPLETED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "COMPLETED",
        completedAt: new Date(),
        // If we have completion notes, add them to the order
        ...(completionNotes && { completionNotes }),
      },
      include: { customer: true }
    });
    
    // Log the completion action
    await (prisma as any).orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "COMPLETE",
        notes: `Order marked as completed by ${session.user.name || session.user.email}`
        + (completionNotes ? `. Notes: ${completionNotes}` : '')
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been marked as completed"
    });
    
  } catch (error) {
    console.error("Error completing order:", error);
    return NextResponse.json(
      { error: "Failed to complete order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 