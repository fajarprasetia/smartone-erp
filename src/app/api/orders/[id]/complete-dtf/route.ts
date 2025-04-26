import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  params: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orderId = params.params.id;
    const { quantity_completed, notes } = await request.json();

    // Validate input
    if (!quantity_completed || quantity_completed <= 0) {
      return NextResponse.json(
        { error: "Valid quantity completed is required" },
        { status: 400 }
      );
    }

    // Check if order exists and is in DTF status
    const order = await db.order.findUnique({
      where: {
        id: orderId,
        status: "DTF",
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not in DTF status" },
        { status: 404 }
      );
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "DTF_COMPLETED",
        dtf_done: new Date(),
        tgl_dtf: new Date(),
        dtf_id: session.user.id,
        qty: quantity_completed,
        catatan_print: notes || null,
      },
      include: {
        dtf: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create log entry
    await db.orderLog.create({
      data: {
        orderId,
        userId: session.user.id,
        action: "DTF_COMPLETED",
        notes: `DTF completed with quantity ${quantity_completed}${notes ? `. Notes: ${notes}` : ''}`
      }
    });

    return NextResponse.json(
      { 
        message: "DTF completed successfully",
        order: updatedOrder 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing DTF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 