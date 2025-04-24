import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    console.log(`Attempting to mark order ${orderId} as COMPLETED`);

    if (!orderId) {
      console.error("No order ID provided to DTF complete endpoint");
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Find the order and ensure it exists
    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error(`Order with ID ${orderId} not found for DTF completion`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    // Update the order status to COMPLETED
    await db.order.update({
      where: { id: orderId },
      data: { 
        status: "COMPLETED",
        updated_at: new Date(),
        dtf_done: new Date(),
        dtf_id: session.user.id
      }
    });

    console.log(`Order ${orderId} successfully marked as COMPLETED`);

    return NextResponse.json({
      success: true,
      message: "Order DTF process completed successfully",
      orderId
    });

  } catch (error) {
    console.error("Error marking order as COMPLETED:", error);
    return NextResponse.json({ 
      error: "Failed to complete DTF process",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 