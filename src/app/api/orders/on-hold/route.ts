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
    
    // Check if order exists and can be put on hold
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
    
    if (order.status === "ON_HOLD") {
      return NextResponse.json(
        { error: "Order is already on hold" },
        { status: 400 }
      );
    }

    // Only allow APPROVED or PENDING orders to be put on hold
    if (order.status !== "APPROVED" && order.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot put order with status ${order.status} on hold. Only APPROVED or PENDING orders can be put on hold.` },
        { status: 400 }
      );
    }
    
    // Update order status to ON_HOLD
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "ON_HOLD",
        holdReason
      } as any,
      include: { customer: true }
    });
    
    // Log the hold action
    await (prisma as any).orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "PUT_ON_HOLD",
        notes: `Order put on hold by ${session.user.name || session.user.email}. Reason: ${holdReason}`
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been put on hold successfully"
    });
    
  } catch (error) {
    console.error("Error putting order on hold:", error);
    return NextResponse.json(
      { error: "Failed to put order on hold", details: (error as Error).message },
      { status: 500 }
    );
  }
} 