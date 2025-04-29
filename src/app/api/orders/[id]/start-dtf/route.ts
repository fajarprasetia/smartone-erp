import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// Import db/schema if it exists or comment out this line if it doesn't
// import { orders, events } from "@/db/schema";
// Comment out drizzle-orm if not needed
// import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(_req: Request, { params }: any) {
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
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const { notes } = await _req.json();

    // Use Prisma instead of Drizzle
    // Fetch the order to ensure it exists and is in a valid state
    const order = await db.order.findUnique({
      where: { id: id },
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
    const updatedOrder = await db.order.update({
      where: { id: id },
      data: {
        status: "DTF_IN_PROGRESS",
        tgl_dtf: new Date(),
        dtf_id: userId,
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

    // Create event for DTF started
    await db.orderLog.create({
      data: {
        orderId: id,
        userId: userId,
        action: "DTF_STARTED",
        notes: "DTF process started",
      },
    });

    // Create an order log entry
    await db.orderLog.create({
      data: {
        orderId: id,
        userId: userId,
        action: "DTF_STARTED",
        notes: "DTF process started",
      },
    });

    return NextResponse.json({
      success: true,
      message: "DTF process started successfully",
    });
  } catch (error) {
    console.error("[API] Error starting DTF:", error);
    return NextResponse.json(
      { error: "Failed to start DTF" },
      { status: 500 }
    );
  }
} 