import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CompleteCuttingParams {
  notes?: string;
  cutting_bagus?: string;
  cutting_reject?: string;
  isOrderComplete?: boolean;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const orderId = params.id;
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

    // First retrieve the order to check if it has a cutting_id
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        cutting_id: true,
        status: true,
      },
    });

    if (!order || !order.cutting_id) {
      return new NextResponse("Order not found or cutting not started", { 
        status: 404 
      });
    }

    // Update the cutting record with completion info
    await prisma.cutting.update({
      where: {
        id: order.cutting_id,
      },
      data: {
        cutting_bagus: cutting_bagus || "0",
        cutting_reject: cutting_reject || "0",
        notes: notes,
        updatedAt: new Date(),
      },
    });

    // Determine the new status
    const newStatus = isOrderComplete ? "COMPLETED" : "CUTTING DONE";

    // Update the order with completion information
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        cutting_done: new Date(), // Record completion time
        status: newStatus, // Update the status
        catatan_cutting: notes || undefined, // Update cutting notes if provided
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cutting process completed. Order status set to ${newStatus}`,
      data: {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      },
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