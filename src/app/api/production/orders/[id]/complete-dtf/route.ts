import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    // Parse the request body
    const body = await req.json();
    const { 
      status,
      dtf_done,
      notes,
      printd_mesin,
      white_precentage,
    } = body;

    // Validate orderId
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

    // Update the order record with only fields that exist in the schema
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status || "COMPLETED_DTF",
        dtf_done: dtf_done || new Date(),
        catatan_print: notes,
        printd_mesin,
        white_precentage,
      },
    });

    // Log activity
    console.log(`DTF process completed for order ${orderId} (basic fields only)`);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error completing DTF process:", error);
    return NextResponse.json(
      { message: "Failed to complete DTF process" },
      { status: 500 }
    );
  }
} 