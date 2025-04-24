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
    
    // Parse request body to get orderId
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists and is in PENDING status
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
    
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: `Order is not in PENDING status. Current status: ${order.status}` },
        { status: 400 }
      );
    }
    
    // Update order status to APPROVED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "APPROVED",
        approve_mng: session.user.id,
        tgl_app_manager: new Date()
      },
      include: { customer: true }
    });
    
    // Log the approval action
    await (prisma as any).orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "APPROVED",
        notes: `Order approved by ${session.user.name || session.user.email}`
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been approved successfully"
    });
    
  } catch (error) {
    console.error("Error approving order:", error);
    return NextResponse.json(
      { error: "Failed to approve order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 