import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: any) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Validate the request body
    if (!body.amount || !body.paymentDate || !body.paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Get the bill
    const bill = await db.bill.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });
    
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    
    // Calculate current paid amount
    const currentPaidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = bill.totalAmount - currentPaidAmount;
    
    // Check if payment amount is valid
    if (body.amount <= 0 || body.amount > remainingAmount) {
      return NextResponse.json({
        error: "Invalid payment amount",
        message: `Payment amount must be between 0 and ${remainingAmount}`
      }, { status: 400 });
    }
    
    // Create the payment
    const payment = await db.payment.create({
      data: {
        billId: id,
        amount: body.amount,
        paymentDate: new Date(body.paymentDate),
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference || null,
        notes: body.notes || null,
      }
    });
    
    // Update bill status based on payment
    const newPaidAmount = currentPaidAmount + body.amount;
    let newStatus = bill.status;
    
    if (newPaidAmount >= bill.totalAmount) {
      newStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL";
    }
    
    // Update the bill
    const updatedBill = await db.bill.update({
      where: { id },
      data: {
        status: newStatus,
        paidAmount: newPaidAmount,
      },
      include: {
        vendor: true,
        payments: true,
      },
    });
    
    // Create a financial transaction record
    await db.financialTransaction.create({
      data: {
        type: "EXPENSE_PAYMENT",
        amount: body.amount,
        description: `Payment for bill #${bill.billNumber}`,
        category: "ACCOUNTS_PAYABLE",
        date: new Date(body.paymentDate),
        billId: id,
      }
    });
    
    return NextResponse.json({
      payment,
      bill: updatedBill,
      message: "Payment recorded successfully"
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ 
      error: "Failed to record payment",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: any) {
  try {
    const { id } = params;
    
    // Get the bill with payments
    const bill = await db.bill.findUnique({
      where: { id },
      include: {
        vendor: true,
        payments: {
          orderBy: {
            paymentDate: "desc"
          }
        },
      },
    });
    
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    
    // Calculate paid amount and remaining amount
    const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = bill.totalAmount - paidAmount;
    
    return NextResponse.json({
      bill: {
        ...bill,
        paidAmount,
        remainingAmount
      }
    });
  } catch (error) {
    console.error("Error fetching bill payment info:", error);
    return NextResponse.json({ 
      error: "Failed to fetch bill payment information",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 