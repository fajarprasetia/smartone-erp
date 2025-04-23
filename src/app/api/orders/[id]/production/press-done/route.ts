import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { bigIntSerializer } from "@/lib/utils";

// Schema for validating the press done data
const pressDoneDataSchema = z.object({
  // Press result fields
  press_bagus: z.string().min(1, "Total good press count is required"),
  press_reject: z.string().min(1, "Rejected press count is required"),
  press_waste: z.string().optional(), // New field for waste
  catatan_press: z.string().default(""),
  // These are optional as we'll force correct values
  status: z.string().optional(), // We always use "PRESS DONE"
  press_done: z.string().optional(), // We default to current date if not provided
});

/**
 * API endpoint for marking a press job as done
 * PATCH /api/orders/[id]/production/press-done
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get order ID from params
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = pressDoneDataSchema.parse(body);
      
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      // Ensure order is in PRESS status
      if (existingOrder.status !== "PRESS") {
        return NextResponse.json(
          { error: "Order is not in PRESS status, cannot mark as done." },
          { status: 400 }
        );
      }

      // Get current timestamp for press_done if not provided
      const currentTimestamp = new Date();

      // Update the order with press done information
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          // Press result details
          press_bagus: validatedData.press_bagus,
          press_reject: validatedData.press_reject,
          press_waste: validatedData.press_waste,
          catatan_press: validatedData.catatan_press,
          
          // Explicitly update status to PRESS DONE
          status: "PRESS DONE", // Force status to PRESS DONE regardless of input
          
          // Update completion timestamp
          press_done: validatedData.press_done ? new Date(validatedData.press_done) : currentTimestamp,
        },
        include: {
          customer: true,
          press: true,
        }
      });

      // Serialize the order data to handle BigInt values
      const serializedOrder = bigIntSerializer(updatedOrder);

      // Return the updated order
      return NextResponse.json({
        message: "Press job marked as completed",
        order: serializedOrder
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid press done data",
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error marking press as done:", error);
    return NextResponse.json(
      { 
        error: "Failed to mark press as done",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 