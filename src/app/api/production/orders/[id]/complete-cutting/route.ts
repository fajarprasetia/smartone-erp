import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating the cutting completion data
const cuttingCompleteSchema = z.object({
  cutting_bagus: z.string().optional(),
  cutting_reject: z.string().optional(),
  catatan_cutting: z.string().optional(),
  cutting_mesin: z.string().optional(),
  cutting_speed: z.string().optional(),
  acc: z.string().optional(),
  power: z.string().optional(),
  cutting_done: z.string().optional(),
  status: z.string().optional(),
});

// Helper function to serialize data, handling BigInt values
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Convert BigInt to String
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    })
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to complete the cutting process" },
        { status: 401 }
      );
    }

    // Get the order ID from the route params
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    console.log("Received request body:", body);
    
    const validatedData = cuttingCompleteSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    // Find the order to update
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare the data to update
    const updateData = {
      // Cutting process completion fields
      cutting_bagus: data.cutting_bagus,
      cutting_reject: data.cutting_reject,
      catatan_cutting: data.catatan_cutting,
      
      // Machine settings fields
      cutting_mesin: data.cutting_mesin,
      cutting_speed: data.cutting_speed,
      acc: data.acc,
      power: data.power,
      
      // Completion date fields - only use existing fields from the schema
      cutting_done: data.cutting_done || new Date().toISOString(),
      
      // Status field
      status: data.status || "COMPLETED",
      
      // Update the updated_at timestamp
      updated_at: new Date(),
    };

    console.log("Updating order with data:", updateData);

    // Update the order with the completed cutting data
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    console.log("Order updated successfully:", updatedOrder.id);

    // Serialize the response to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json(
      { message: "Cutting completed successfully", order: serializedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing cutting process:", error);
    return NextResponse.json(
      { error: "Failed to complete cutting process", details: String(error) },
      { status: 500 }
    );
  }
} 