import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface StartCuttingParams {
  assignee: string;
  notes?: string;
  cutting_mesin: string;
  cutting_speed: string;
  acc?: string;
  power?: string;
  cutting_bagus?: string;
  cutting_reject?: string;
  userId: string;
  orderId: string;
}

export async function PATCH(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await _req.json();
    const {
      assignee,
      notes,
      cutting_mesin,
      cutting_speed,
      acc,
      power,
      cutting_bagus,
      cutting_reject,
      userId
    } = body as StartCuttingParams;

    // Create a cutting record first
    const cutting = await prisma.order.create({
      data: {
        cutting_id: assignee,
        catatan_cutting: notes || "",
        cutting_mesin,
        cutting_speed,
        acc: acc || "",
        power: power || "",
        cutting_bagus: cutting_bagus || "0",
        cutting_reject: cutting_reject || "0",
        userId: userId || null,
        tgl_cutting: new Date(),
      },
    });

    // Update the order with the cutting information
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "CUTTING_IN_PROGRESS",
        tgl_cutting: new Date(),
        cutting_id: session.user.id,
      },
      include: {
        cutting: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Cutting process started successfully",
      data: {
        orderId: updatedOrder.id,
        cuttingId: cutting.id,
        status: updatedOrder.status,
      }
    });
  } catch (error) {
    console.error("[API] Error starting cutting:", error);
    return NextResponse.json(
      { error: "Failed to start cutting" },
      { status: 500 }
    );
  }
} 