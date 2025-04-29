import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { 
      orderId, 
      quantity_completed, 
      completion_date, 
      quality_check, 
      notes,
      status,
      dtf_done,
      // DTF specific fields
      printd_mesin,
      printd_icc,
      pet,
      suhu_meja,
      printd_speed,
      white_setting,
      choke,
      white_percentage,
      total_pet
    } = body;

    // Log the received data
    console.log("Received temp-dtf/complete request with orderId:", orderId);

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

      // Prepare update data with only valid fields
      const updateData: any = {
        status: status || "COMPLETED_DTF",
        dtf_done: dtf_done || new Date(),
      };

      // Add optional fields if they exist
      if (notes) updateData.catatan_print = notes;
      if (printd_mesin) updateData.printd_mesin = printd_mesin;
      if (printd_icc) updateData.printd_icc = printd_icc;
      if (pet) updateData.pet = pet;
      if (suhu_meja) updateData.suhu_meja = suhu_meja;
      if (printd_speed) updateData.printd_speed = printd_speed;
      if (white_setting) updateData.white_setting = white_setting;
      if (choke) updateData.choke = choke;
      if (white_percentage) updateData.white_precentage = white_percentage; // Note field name correction
      if (total_pet) updateData.total_pet = total_pet;

      // Update the order record
      const updatedOrder = await prisma.order.update({
        where: {
          id: orderId,
        },
        data: updateData,
      });

      // Log activity and store additional data
      console.log(`DTF process completed for order ${orderId} with quality check: ${quality_check}`);
      console.log(`Quantity completed: ${quantity_completed}, Quality check: ${quality_check}`);

      return NextResponse.json({
        success: true,
        message: "DTF process completed successfully",
        data: {
          ...updatedOrder,
          quantity_completed,
          quality_check
        }
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