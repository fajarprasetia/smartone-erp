import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface StartCuttingParams {
  catatan_cutting?: string;
  cutting_mesin: string;
  cutting_speed: string;
  acc?: string;
  power?: string;
  cutting_bagus?: string;
  cutting_id: string;
  status: string;
  tgl_cutting: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      id: orderId,
      catatan_cutting,
      cutting_mesin,
      cutting_speed,
      acc,
      power,
      cutting_bagus,
      cutting_id,
      status,
      tgl_cutting
    } = body as StartCuttingParams & { id: string };

    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    // Validate required fields
    if (!cutting_id || !cutting_mesin || !cutting_speed) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update the order with the cutting information
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        cutting_id, // Use the current user ID
        tgl_cutting: new Date(tgl_cutting), // Use the provided timestamp
        status: status || "CUTTING", // Use the provided status or default to "CUTTING"
        catatan_cutting: catatan_cutting || "", // Store cutting notes
        cutting_mesin,
        cutting_speed,
        acc: acc || "",
        power: power || "",
        cutting_bagus: cutting_bagus || "0",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Cutting process started successfully",
      data: {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      }
    });
  } catch (error) {
    console.error("Error starting cutting process:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Failed to start cutting process",
        error: (error as Error).message,
      }),
      { status: 500 }
    );
  }
} 