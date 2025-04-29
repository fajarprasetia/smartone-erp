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
    const { orderId, holdReason, expectedResumptionDate } = await request.json();
    
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
    
    // Parse expected resumption date
    let resumptionDate = null;
    if (expectedResumptionDate) {
      resumptionDate = new Date(expectedResumptionDate);
      if (isNaN(resumptionDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expected resumption date format" },
          { status: 400 }
        );
      }
    }
    
    // Update order status to ON_HOLD
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "ON_HOLD",
        holdPlacedBy: session.user.id,
        holdPlacedAt: new Date(),
        holdReason: holdReason,
        expectedResumptionDate: resumptionDate
      } as any,
      include: { customer: true }
    });
    
    // Log the hold action
    await (prisma as any).orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "ON_HOLD",
        notes: expectedResumptionDate
          ? `Order put on hold by ${session.user.name || session.user.email}. Reason: ${holdReason}. Expected to resume on: ${new Date(expectedResumptionDate).toISOString().split('T')[0]}`
          : `Order put on hold by ${session.user.name || session.user.email}. Reason: ${holdReason}`
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