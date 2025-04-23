import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Get order ID from params
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const { notes } = await request.json();

    // Fetch the order to ensure it exists and is in a valid state
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify the order status is PRESS
    if (order.status !== "PRESS") {
      return NextResponse.json(
        { error: "Order must be in PRESS status to start DTF" },
        { status: 400 }
      );
    }

    // Update order status to DTF and record start time
    await db
      .update(orders)
      .set({
        status: "DTF",
        dtf_started_at: new Date(),
        dtf_started_by: userId,
        dtf_notes: notes || null,
      })
      .where(eq(orders.id, orderId));

    // Create event for DTF started
    await db.insert(events).values({
      order_id: orderId,
      event_type: "DTF_STARTED",
      user_id: userId,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      message: "DTF process started successfully",
    });
  } catch (error) {
    console.error("Error starting DTF process:", error);
    return NextResponse.json(
      { error: "Failed to start DTF process" },
      { status: 500 }
    );
  }
} 