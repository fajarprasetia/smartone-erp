import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface CompleteCuttingParams {
  notes?: string;
  cutting_bagus?: string;
  cutting_reject?: string;
  isOrderComplete?: boolean;
}

export async function PATCH(
  req: Request,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const orderId = params.orderId;
    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    const body = await req.json();
    const {
      notes,
      cutting_bagus,
      cutting_reject,
      isOrderComplete = false,
    } = body as CompleteCuttingParams;

    // First retrieve the order
    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return new NextResponse("Order not found", { 
        status: 404 
      });
    }

    // Determine the new status
    const newStatus = isOrderComplete ? "COMPLETED" : "CUTTING_DONE";

    // Update the order with completion information
    const updatedOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        cutting_done: new Date(),
        status: newStatus,
        catatan_cutting: notes || null,
        cutting_bagus: cutting_bagus || null,
        cutting_reject: cutting_reject || null,
      },
    });

    // Create order log
    await db.orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: 'CUTTING_COMPLETED',
        notes: `Cutting completed. Good: ${cutting_bagus || 0}, Reject: ${cutting_reject || 0}${notes ? ` - Notes: ${notes}` : ''}`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cutting process completed. Order status set to ${newStatus}`,
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error completing cutting process:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Failed to complete cutting process",
        error: (error as Error).message,
      }),
      { status: 500 }
    );
  }
} 