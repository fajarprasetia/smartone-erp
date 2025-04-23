import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// API handler for processing order payments
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      orderId, 
      amount, 
      paymentMethod, 
      paymentType, // "DP" or "FULL" or "SETTLEMENT"
      notes,
      receiptImageUrl 
    } = data;

    if (!orderId || !amount || !paymentMethod || !paymentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get order data
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // 1. Create a financial transaction record
      const transaction = await tx.financialTransaction.create({
        data: {
          transactionNumber: `TRX-${Date.now()}`,
          type: "INCOME",
          amount: parseFloat(amount),
          description: `Payment for order ${order.spk || order.id}`,
          category: "SALES",
          date: new Date(),
          status: "COMPLETED",
          paymentMethod,
          notes,
          receiptImageUrl,
          orderId,
        }
      });

      // 2. Update order payment details
      let orderUpdateData: any = {};
      const parsedAmount = parseFloat(amount);
      
      // Handle different payment types
      if (paymentType === "DP") {
        orderUpdateData = {
          dp: parsedAmount.toString(),
          tgl_dp: new Date(),
          jenis_pembayaran: paymentMethod,
          tf_dp: receiptImageUrl,
          sisa: (parseFloat(order.nominal_total || "0") - parsedAmount).toString(),
          catatan_tf: notes,
        };
      } else if (paymentType === "FULL") {
        orderUpdateData = {
          dp: parsedAmount.toString(),
          tgl_dp: new Date(),
          tgl_lunas: new Date(),
          jenis_pembayaran: paymentMethod,
          tf_full: receiptImageUrl,
          sisa: "0",
          catatan_tf: notes,
        };
      } else if (paymentType === "SETTLEMENT") {
        orderUpdateData = {
          pelunasan: parsedAmount.toString(),
          tgl_lunas: new Date(),
          jenis_pembayaran: paymentMethod,
          tf_pelunasan: receiptImageUrl,
          sisa: "0",
          catatan_tf: notes,
        };
      }

      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: orderUpdateData
      });

      // 3. Create an invoice if it doesn't exist
      let invoice = await tx.invoice.findFirst({
        where: { orderId }
      });
      
      if (!invoice) {
        // Create new invoice
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber: `INV-${order.spk || order.id}`,
            invoiceDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
            status: paymentType === "FULL" || paymentType === "SETTLEMENT" ? "PAID" : "PARTIALLY_PAID",
            customerId: order.customer_id,
            orderId,
            subtotal: parseFloat(order.nominal_total || "0"),
            tax: 0, // No tax by default
            discount: 0, // No discount by default
            total: parseFloat(order.nominal_total || "0"),
            amountPaid: parsedAmount,
            balance: paymentType === "FULL" || paymentType === "SETTLEMENT" ? 0 : parseFloat(order.nominal_total || "0") - parsedAmount,
            notes: `Payment processed via ${paymentMethod}`,
          }
        });
      } else {
        // Update existing invoice
        const newAmountPaid = invoice.amountPaid + parsedAmount;
        const newBalance = invoice.total - newAmountPaid;
        
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: newBalance <= 0 ? "PAID" : "PARTIALLY_PAID",
            amountPaid: newAmountPaid,
            balance: newBalance,
            notes: `${invoice.notes || ""}\nAdditional payment of ${parsedAmount} processed via ${paymentMethod}`,
          }
        });
      }

      // Connect the transaction to the invoice
      await tx.financialTransaction.update({
        where: { id: transaction.id },
        data: {
          invoiceId: invoice.id
        }
      });

      // 4. Log the payment action in order logs
      await tx.orderLog.create({
        data: {
          orderId,
          userId: data.userId || "system",
          action: `PAYMENT_${paymentType}`,
          notes: `Payment of ${parsedAmount} processed via ${paymentMethod}`,
          timestamp: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
        transaction,
        order: updatedOrder,
        invoice
      });
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { 
        error: "Failed to process payment", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// API handler for getting order payment history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    const transactions = await db.financialTransaction.findMany({
      where: { orderId },
      orderBy: { date: "desc" }
    });
    
    const invoice = await db.Invoice.findFirst({
      where: { orderId }
    });
    
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        spk: true,
        nominal: true,
        nominal_total: true,
        dp: true,
        tgl_dp: true,
        sisa: true,
        tgl_lunas: true,
        jenis_pembayaran: true
      }
    });
    
    return NextResponse.json({
      transactions,
      invoice,
      orderPaymentDetails: order
    });
    
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch payment history", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 