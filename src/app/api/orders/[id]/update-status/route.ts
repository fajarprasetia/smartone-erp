import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { bigIntSerializer } from "@/lib/utils";

/**
 * API endpoint for updating order status fields
 * POST /api/orders/[id]/update-status
 */
export async function POST(
  req: Request,
  params: any
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
    const orderId = params.params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { keterangan } = body;

    // Check if keterangan field is provided
    if (!keterangan) {
      return NextResponse.json(
        { error: "keterangan field is required" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update the order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { 
        keterangan,
        // If setting to "SUDAH DIINVOICEKAN", also update invoice date if not already set
        ...(keterangan === "SUDAH DIINVOICEKAN" && !existingOrder.tgl_invoice && {
          tgl_invoice: new Date()
        })
      },
    });

    // Serialize data to handle BigInt values and return response
    return NextResponse.json(
      { 
        message: "Order status updated successfully",
        order: bigIntSerializer(updatedOrder)
      }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { 
        error: "Failed to update order status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 