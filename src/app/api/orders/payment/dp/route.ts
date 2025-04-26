import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to serialize BigInt values
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Convert BigInt to String during serialization
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
}

/**
 * API route for recording down payment for an order
 * POST /api/orders/payment/dp
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      orderId,
      paymentDate,
      paymentMethod,
      payment,
      notes,
      receiptPath
    } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (!payment || isNaN(Number(payment)) || Number(payment) <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate remaining payment
    const nominal = order.nominal ? parseFloat(String(order.nominal)) : 0;
    const paymentAmount = parseFloat(String(payment));
    const remainingPayment = nominal - paymentAmount;

    // Update order with payment info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        dp: String(paymentAmount),
        sisa: String(remainingPayment),
        tgl_dp: paymentDate ? new Date(paymentDate) : new Date(),
        jenis_pembayaran: paymentMethod || "Transfer",
        biaya_tambahan: "DP",
        catatan_tf: notes || "",
        tf_dp: receiptPath || null,
        approval: "APPROVED"
      },
    });

    // Serialize data to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json({
      message: "Down payment recorded successfully",
      order: serializedOrder,
    });
  } catch (error) {
    console.error("Error recording down payment:", error);
    return NextResponse.json(
      { error: "Failed to record down payment" },
      { status: 500 }
    );
  }
}

/**
 * API route for updating down payment information
 * PATCH /api/orders/payment/dp
 */
export async function PATCH(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      orderId,
      paymentDate,
      paymentMethod,
      payment,
      notes,
      receiptPath
    } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (!payment || isNaN(Number(payment)) || Number(payment) <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate remaining payment
    const nominal = order.nominal ? parseFloat(String(order.nominal)) : 0;
    const paymentAmount = parseFloat(String(payment));
    const remainingPayment = nominal - paymentAmount;

    // Update order with payment info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        dp: String(paymentAmount),
        sisa: String(remainingPayment),
        tgl_dp: paymentDate ? new Date(paymentDate) : new Date(),
        jenis_pembayaran: paymentMethod || "Transfer",
        biaya_tambahan: "DP",
        catatan_tf: notes || "",
        ...(receiptPath && { tf_dp: receiptPath }),
      },
    });

    // Serialize data to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json({
      message: "Down payment updated successfully",
      order: serializedOrder,
    });
  } catch (error) {
    console.error("Error updating down payment:", error);
    return NextResponse.json(
      { error: "Failed to update down payment" },
      { status: 500 }
    );
  }
} 