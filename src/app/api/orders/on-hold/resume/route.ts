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
    const { orderId, resumptionNote } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists and is in ON_HOLD status
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
    
    if (order.status !== "ON_HOLD") {
      return NextResponse.json(
        { error: `Order is not in ON_HOLD status. Current status: ${order.status}` },
        { status: 400 }
      );
    }
    
    // Update order status back to APPROVED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "APPROVED",
        resumedBy: session.user.id,
        resumedAt: new Date(),
        resumptionNote: resumptionNote || ""
      } as any,
      include: { customer: true }
    });
    
    // Log the resume action
    await (prisma as any).orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "RESUMED",
        notes: resumptionNote 
          ? `Order resumed from hold by ${session.user.name || session.user.email}. Note: ${resumptionNote}`
          : `Order resumed from hold by ${session.user.name || session.user.email}`
      }
    });
    
    return NextResponse.json({
      order: serializeData(updatedOrder),
      message: "Order has been resumed successfully"
    });
    
  } catch (error) {
    console.error("Error resuming order:", error);
    return NextResponse.json(
      { error: "Failed to resume order", details: (error as Error).message },
      { status: 500 }
    );
  }
} 