import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { bigIntSerializer } from "@/lib/utils";

// Schema for validating the press data
const pressDataSchema = z.object({
  // Press fields
  press_mesin: z.string().optional(),
  press_presure: z.string().optional(),
  press_suhu: z.string().optional(),
  press_speed: z.string().optional(),
  press_protect: z.string().optional(),
  total_kain: z.string().optional(),
  press_qty: z.string().optional(), // We'll map this to prints_qty internally
  // Press operator
  press_id: z.string(),
  // Timestamp
  tgl_press: z.string().optional(),
  // These are optional as we'll force correct values
  status: z.string().optional(), // We always use "PRESS"
});

/**
 * API endpoint for updating press information
 * PATCH /api/orders/[id]/production/press
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
      const validatedData = pressDataSchema.parse(body);
      
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

      // Ensure order is in PRINT DONE status
      if (existingOrder.status !== "PRINT DONE") {
        return NextResponse.json(
          { error: "Order must be in PRINT DONE status before setting to PRESS" },
          { status: 400 }
        );
      }

      // Get current timestamp for tgl_press if not provided
      const currentTimestamp = new Date();
      
      // Update the order with press information
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          // Press details
          press_mesin: validatedData.press_mesin,
          press_presure: validatedData.press_presure,
          press_suhu: validatedData.press_suhu,
          press_speed: validatedData.press_speed ? parseFloat(validatedData.press_speed) : undefined,
          press_protect: validatedData.press_protect,
          total_kain: validatedData.total_kain,
          // Map press_qty to prints_qty since press_qty doesn't exist in the schema
          prints_qty: validatedData.press_qty,
          
          // Update press operator
          press: validatedData.press_id ? {
            connect: {
              id: validatedData.press_id
            }
          } : undefined,
          
          // Explicitly update status to PRESS
          status: "PRESS", // Force status to PRESS regardless of input
          
          // Update timestamp for tgl_press
          tgl_press: validatedData.tgl_press ? new Date(validatedData.tgl_press) : currentTimestamp,
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
        message: "Order status updated to PRESS and press information saved",
        order: serializedOrder
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid press data",
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating press information:", error);
    return NextResponse.json(
      { 
        error: "Failed to update press information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 