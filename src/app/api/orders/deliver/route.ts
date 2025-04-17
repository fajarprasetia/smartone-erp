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
    const { orderId, deliveryNotes, deliveryDate } = await request.json();
    
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
    
    // Check if order is already delivered
    if (order.status === "DELIVERED") {
      return NextResponse.json(
        { error: "Order is already delivered" },
        { status: 400 }
      );
    }
    
    // Normally, only COMPLETED orders should be marked as delivered
    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed orders can be marked as delivered" },
        { status: 400 }
      );
    }
    
    // Parse delivery date if provided, otherwise use current date
    const parsedDeliveryDate = deliveryDate ? new Date(deliveryDate) : new Date();
    
    // Update order status to DELIVERED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "DELIVERED",
        tgl_pengiriman: parsedDeliveryDate,
        // If we have delivery notes, add them
        ...(deliveryNotes && { catatan: deliveryNotes }),
      },
      include: { customer: true }
    });
    
    // Log the delivery action
    await prisma.orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "DELIVER",
        notes: `Order marked as delivered by ${session.user.name || session.user.email}. Delivery date: ${parsedDeliveryDate.toISOString().split('T')[0]}`
        + (deliveryNotes ? `. Notes: ${deliveryNotes}` : '')
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been marked as delivered"
    });
    
  } catch (error) {
    console.error("Error marking order as delivered:", error);
    return NextResponse.json(
      { error: "Failed to mark order as delivered", details: (error as Error).message },
      { status: 500 }
    );
  }
} 