import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Schema validation for press done updates
const pressDoneSchema = z.object({
  press_bagus: z.string().min(1, "Number of good items is required"),
  press_waste: z.string().optional(),
  catatan_press: z.string().optional(),
  press_done: z.string().optional(),
  status: z.string().optional(), // Next status (CUTTING READY or COMPLETED)
  statusm: z.string().optional(), // Production status (PRESS DONE)
  // Additional press fields
  press_mesin: z.string().optional(),
  press_presure: z.string().optional(),
  press_suhu: z.string().optional(),
  press_protect: z.string().optional(),
  press_speed: z.string().optional(),
  total_kain: z.string().optional(),
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
    const validationResult = pressDoneSchema.safeParse(requestData);
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
    
    // Remove the status check to make the endpoint more flexible
    // This allows any order to be marked as PRESS DONE regardless of current status
    
    // Determine next status based on product type if not provided
    let nextStatus = validatedData.status;
    let nextStatusM = validatedData.statusm || "PRESS DONE";
    
    if (!nextStatus) {
      // Check product type to determine status
      const isPressOnly = order.produk === "PRESS ONLY";
      const needsCutting = (order.produk || "").includes("CUTTING");
      
      if (isPressOnly) {
        nextStatus = "COMPLETED";
        nextStatusM = "COMPLETED";
      } else if (needsCutting) {
        nextStatus = "CUTTING READY";
        nextStatusM = "PRESS DONE";
      } else {
        // Default to COMPLETED if not press only or needs cutting
        nextStatus = "COMPLETED";
        nextStatusM = "PRESS DONE";
      }
    }
    
    // Parse the press_speed value to a number if it exists
    let pressSpeed = null;
    if (validatedData.press_speed && validatedData.press_speed.trim() !== "") {
      const parsedValue = parseFloat(validatedData.press_speed);
      if (!isNaN(parsedValue)) {
        pressSpeed = parsedValue;
      }
    }
    
    // Prepare the data for database update
    const updateData = {
      // Basic completion fields
      press_bagus: validatedData.press_bagus,
      press_waste: validatedData.press_waste || undefined,
      catatan_press: validatedData.catatan_press,
      press_done: validatedData.press_done || new Date().toISOString(),
      status: nextStatus,
      statusm: nextStatusM,
      
      // Additional press details (only update if provided)
      ...(validatedData.press_mesin ? { press_mesin: validatedData.press_mesin } : {}),
      ...(validatedData.press_presure ? { press_presure: validatedData.press_presure } : {}),
      ...(validatedData.press_suhu ? { press_suhu: validatedData.press_suhu } : {}),
      ...(validatedData.press_protect ? { press_protect: validatedData.press_protect } : {}),
      ...(pressSpeed !== null ? { press_speed: pressSpeed } : {}),
      ...(validatedData.total_kain ? { total_kain: validatedData.total_kain } : {})
    };
    
    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating press done information:", error);
    return NextResponse.json(
      { error: "Failed to complete press job", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 