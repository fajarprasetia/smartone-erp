import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { 
      orderId, 
      status,
      dtf_done,
      catatan_print
    } = body;

    // Log the received data
    console.log("Received complete-dtf request with body:", JSON.stringify(body));

    // Validate required fields
    if (!orderId) {
      console.error("Missing orderId in request");
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the session
    const session = await getServerSession();
    if (!session?.user) {
      console.error("User not authenticated");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      // First verify that the order exists
      const orderExists = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true }
      });
      
      if (!orderExists) {
        console.error(`Order ${orderId} not found`);
        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 }
        );
      }

      // Update the order record with minimal fields
      const updatedOrder = await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: status || "COMPLETED_DTF",
          dtf_done: dtf_done || new Date()
        },
      });

      // Attempt to update notes in a separate query if provided
      if (catatan_print) {
        try {
          await prisma.order.update({
            where: { id: orderId },
            data: { catatan_print }
          });
        } catch (noteError) {
          console.warn("Failed to update notes, but DTF status was updated:", noteError);
        }
      }

      // Log activity
      console.log(`DTF process completed for order ${orderId} (minimal update)`);

      return NextResponse.json({ 
        success: true, 
        message: "DTF completed successfully",
        order: updatedOrder
      });
    } catch (prismaError: any) {
      // Log specific Prisma error
      console.error("Prisma error:", prismaError.message);
      
      return NextResponse.json(
        { 
          message: "Database error while completing DTF process",
          error: prismaError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error completing DTF process:", error.message);
    return NextResponse.json(
      { 
        message: "Failed to complete DTF process",
        error: error.message
      },
      { status: 500 }
    );
  }
} 