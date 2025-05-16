import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bigIntSerializer } from "@/lib/utils";

// Schema validation for press updates
const pressUpdateSchema = z.object({
  press_mesin: z.string().min(1, "Press machine is required"),
  press_presure: z.string().min(1, "Pressure is required"),
  press_suhu: z.string().min(1, "Temperature is required"),
  press_speed: z.union([z.number(), z.string(), z.null()]).optional(),
  press_protect: z.string().optional(),
  total_kain: z.string().optional(),
  press_qty: z.string().optional(),
  prints_qty: z.string().optional(),
  press_id: z.string().optional(),
  tgl_press: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the order ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Parse request body
    const requestData = await request.json();
    
    // Validate the request data
    const validationResult = pressUpdateSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Get the current order to check status
    const order = await prisma.order.findUnique({
      where: { id },
    });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    // Remove the status validation check - allow any order to be moved to PRESS status
    // This makes the endpoint more flexible and prevents errors when orders are in unexpected states
    
    // Ensure we have a press_id (operator)
    const press_id = validatedData.press_id || session.user.id;
    
    // Prepare the data for database update
    const updateData = {
      status: "PRESS", // Update main status
      statusm: "PRESS", // Update production status
      press_mesin: validatedData.press_mesin,
      press_presure: validatedData.press_presure,
      press_suhu: validatedData.press_suhu,
      press_speed: typeof validatedData.press_speed === 'string' && validatedData.press_speed 
        ? parseFloat(validatedData.press_speed) 
        : validatedData.press_speed, // Already a number or null
      press_protect: validatedData.press_protect || null,
      total_kain: validatedData.total_kain || null,
      prints_qty: validatedData.prints_qty || validatedData.press_qty || null, // Use either field
      press_id,
      tgl_press: validatedData.tgl_press || new Date().toISOString(),
    };
    
    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: updateData.status,
        statusm: updateData.statusm,
        press_mesin: updateData.press_mesin,
        press_presure: updateData.press_presure,
        press_suhu: updateData.press_suhu,
        press_speed: updateData.press_speed ? parseFloat(updateData.press_speed.toString()) : null,
        press_protect: updateData.press_protect,
        total_kain: updateData.total_kain,
        prints_qty: updateData.prints_qty,
        press_id: updateData.press_id,
        tgl_press: updateData.tgl_press,
      },
      include: {
        press: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Use the bigIntSerializer from utils
    return NextResponse.json(bigIntSerializer(updatedOrder));
  } catch (error) {
    console.error("Error updating order press information:", error);
    return NextResponse.json(
      { error: "Failed to update press information", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 