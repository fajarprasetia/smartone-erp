import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { orderId, machine, notes, status, statusm, dtf_id, tgl_dtf } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update the order record to start DTF process
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        statusm: statusm || "ON PRODUCTION",
        status: status || "DTF",
        dtf_id: dtf_id || session.user.id,
        tgl_dtf: tgl_dtf || new Date(),
        printd_mesin: machine,
        catatan_print: notes,
      },
    });

    // Log activity
    console.log(`DTF process started for order ${orderId} using machine: ${machine}`);

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Error starting DTF process:", error);
    return NextResponse.json(
      { message: "Failed to start DTF process" },
      { status: 500 }
    );
  }
} 