import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get specific bill
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const bill = await db.bill.findUnique({
      where: { id },
      include: {
        vendor: true,
        payments: true,
        items: true,
        transactions: true,
        attachments: true,
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
        remainingAmount,
      }
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json({ 
      error: "Failed to fetch bill data",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Update bill
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Check if bill exists
    const existingBill = await db.bill.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });
    
    if (!existingBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    
    // Don't allow updating if bill is already paid
    if (existingBill.status === "PAID") {
      return NextResponse.json({ error: "Cannot update a paid bill" }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (body.issueDate) updateData.issueDate = new Date(body.issueDate);
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.description) updateData.description = body.description;
    if (body.reference) updateData.reference = body.reference;
    if (body.notes) updateData.notes = body.notes;
    
    // If updating the bill's vendor
    if (body.vendorId) {
      // Verify vendor exists
      const vendor = await db.vendor.findUnique({
        where: { id: body.vendorId },
      });
      
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 400 });
      }
      
      updateData.vendorId = body.vendorId;
    }
    
    // If updating bill items
    if (body.items) {
      // Delete existing items and recreate them
      await db.billItem.deleteMany({
        where: { billId: id },
      });
      
      // Calculate new total amount
      const totalAmount = body.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      updateData.totalAmount = totalAmount;
      
      // Create new items
      await Promise.all(body.items.map((item: any) => {
        return db.billItem.create({
          data: {
            billId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            taxRate: item.taxRate || 0,
            accountId: item.accountId,
          },
        });
      }));
    }
    
    // Update the bill
    const updatedBill = await db.bill.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        payments: true,
        items: true,
      },
    });
    
    return NextResponse.json({
      bill: updatedBill,
      message: "Bill updated successfully",
    });
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json({ 
      error: "Failed to update bill",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Delete bill
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Check if bill exists
    const bill = await db.bill.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });
    
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    
    // Don't allow deletion if bill has payments
    if (bill.payments.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete a bill with payments",
        message: "Please delete all payments first or mark the bill as cancelled instead."
      }, { status: 400 });
    }
    
    // Delete related records first
    await db.billItem.deleteMany({
      where: { billId: id },
    });
    
    await db.attachment.deleteMany({
      where: { billId: id },
    });
    
    // Delete financial transactions related to this bill
    await db.financialTransaction.deleteMany({
      where: { billId: id },
    });
    
    // Delete the bill
    await db.bill.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: "Bill deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json({ 
      error: "Failed to delete bill",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 