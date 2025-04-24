import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    
    // You'll need to examine your schema to use the correct model and field names
    // This is a placeholder based on your original code
    const productionStarted = await prisma.order.findFirst({
      where: { 
        id: orderId,
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
        status: "CANCELED"
        // Add other fields according to your schema
      },
      include: { customer: true }
    });
    
    // Log cancellation in console for now
    console.log(`Order ${orderId} canceled by user ${session.user.id}: ${cancellationReason || "No reason provided"}`);
    
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