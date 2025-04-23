import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orderId = params.id;
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
        status: "CUTTING", // Move to next step in production flow
        dtf_completed_at: new Date(),
        dtf_completed_by: session.user.id,
        dtf_quantity_completed: quantity_completed,
        dtf_notes: notes || null,
        // Add order event
        events: {
          create: {
            type: "DTF_COMPLETED",
            user_id: session.user.id,
            details: {
              quantity_completed,
              notes: notes || null,
            },
          },
        },
      },
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