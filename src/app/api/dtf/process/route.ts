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

    const { id } = await req.json();
    
    console.log(`Processing DTF order with ID: ${id}`);
    
    if (!id) {
      console.error("No order ID provided");
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Try to find order first to confirm it exists
    const orderExists = await db.order.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!orderExists) {
      console.error(`Order not found with ID: ${id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`Found order ${id} with status: ${orderExists.status}`);

    // Update the order status to "DTF PROCESS"
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: "DTF PROCESS",
        updated_at: new Date()
      }
    });

    console.log(`Successfully updated order ${id} to DTF PROCESS`);

    return NextResponse.json({
      success: true,
      message: "Order moved to DTF PROCESS successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error processing DTF order:", error);
    return NextResponse.json({ 
      error: "Failed to process DTF order",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 