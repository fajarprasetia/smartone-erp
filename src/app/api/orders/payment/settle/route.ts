import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
 * API route for settling an order payment
 * POST /api/orders/payment/settle
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

    // Calculate remaining payment after this payment
    const currentRemaining = order.sisa ? parseFloat(String(order.sisa)) : 0;
    const paymentAmount = parseFloat(String(payment));
    let newRemaining = currentRemaining - paymentAmount;
    
    // Ensure we don't have negative remaining (overpayment case)
    newRemaining = newRemaining < 0 ? 0 : newRemaining;

    // Determine if payment is complete
    const isFullyPaid = newRemaining <= 0;

    // Update order with payment info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        sisa: String(newRemaining),
        tgl_lunas: isFullyPaid ? (paymentDate ? new Date(paymentDate) : new Date()) : undefined,
        jenis_pembayaran: paymentMethod || "Transfer",
        biaya_tambahan: isFullyPaid ? "LUNAS" : order.biaya_tambahan,
        catatan_tf: isFullyPaid ? "LUNAS" : (notes || ""),
        ...(receiptPath && { tf_pelunasan: receiptPath }),
      },
    });

    // Serialize data to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json({
      message: isFullyPaid 
        ? "Payment completed successfully" 
        : "Partial payment recorded successfully",
      order: serializedOrder,
      fullyPaid: isFullyPaid
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

/**
 * API route for updating payment information
 * PATCH /api/orders/payment/settle
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

    // Calculate remaining payment after this payment
    const currentRemaining = order.sisa ? parseFloat(String(order.sisa)) : 0;
    const paymentAmount = parseFloat(String(payment));
    let newRemaining = currentRemaining - paymentAmount;
    
    // Ensure we don't have negative remaining (overpayment case)
    newRemaining = newRemaining < 0 ? 0 : newRemaining;

    // Determine if payment is complete
    const isFullyPaid = newRemaining <= 0;

    // Update order with payment info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        sisa: String(newRemaining),
        tgl_lunas: isFullyPaid ? (paymentDate ? new Date(paymentDate) : new Date()) : undefined,
        jenis_pembayaran: paymentMethod || "Transfer",
        biaya_tambahan: isFullyPaid ? "LUNAS" : order.biaya_tambahan,
        catatan_tf: isFullyPaid ? "LUNAS" : (notes || ""),
        ...(receiptPath && { tf_pelunasan: receiptPath }),
      },
    });

    // Serialize data to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json({
      message: isFullyPaid 
        ? "Payment completed successfully" 
        : "Partial payment recorded successfully",
      order: serializedOrder,
      fullyPaid: isFullyPaid
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
} 