import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const billId = params.id;
    
    // Fetch the bill with its vendor
    const bill = await db.bill.findUnique({
      where: { id: billId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        attachments: true,
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    // Transform the data for the frontend
    const billResponse = {
      id: bill.id,
      billNumber: bill.billNumber,
      vendorId: bill.vendorId,
      vendorName: bill.vendor.name,
      description: bill.description,
      notes: bill.notes || "",
      issueDate: bill.issueDate.toISOString(),
      dueDate: bill.dueDate.toISOString(),
      items: bill.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),
      attachments: bill.attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        uploadDate: attachment.createdAt.toISOString(),
      })),
      totalAmount: Number(bill.totalAmount),
      paidAmount: Number(bill.paidAmount),
      status: bill.status,
      createdAt: bill.createdAt.toISOString(),
      updatedAt: bill.updatedAt.toISOString(),
      payments: bill.payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        date: payment.createdAt.toISOString(),
        notes: payment.notes || "",
      })),
    };

    return NextResponse.json(billResponse);
  } catch (error) {
    console.error("Error fetching bill details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill details" },
      { status: 500 }
    );
  }
}

// PUT endpoint - update bill by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user and check authentication
    const user = await auth();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get bill ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Bill ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const data = await request.json();
    const {
      vendorId,
      description,
      issueDate,
      dueDate,
      items,
      notes,
    } = data;

    // Validate required fields
    if (!vendorId || !description || !issueDate || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the bill exists
    const existingBill = await db.bill.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!existingBill) {
      return NextResponse.json(
        { message: "Bill not found" },
        { status: 404 }
      );
    }

    // Check if bill is paid or partially paid (can't edit in those states)
    if (existingBill.status === "paid" || existingBill.status === "partially_paid") {
      return NextResponse.json(
        { message: "Paid or partially paid bills cannot be edited" },
        { status: 400 }
      );
    }

    // Calculate the total amount of the bill
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0
    );

    // Determine the bill status
    let status = existingBill.status;
    if (status === "draft" || status === "pending" || status === "overdue") {
      // If due date has passed, mark as overdue
      if (new Date(dueDate) < new Date() && status !== "draft") {
        status = "overdue";
      } else if (status !== "draft") {
        status = "pending";
      }
    }

    // Update bill in a transaction to ensure data consistency
    const updatedBill = await db.$transaction(async (tx) => {
      // Update the bill
      const bill = await tx.bill.update({
        where: { id },
        data: {
          vendorId,
          description,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          totalAmount,
          status,
          notes: notes || "",
          updatedAt: new Date(),
        },
      });

      // Get existing item IDs for comparison
      const existingItemIds = existingBill.items.map(item => item.id);
      const updatedItemIds = items.filter(item => item.id).map(item => item.id);

      // Find items to delete (items that exist in the database but not in the updated list)
      const itemsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));
      if (itemsToDelete.length > 0) {
        await tx.billItem.deleteMany({
          where: {
            id: {
              in: itemsToDelete,
            },
          },
        });
      }

      // Update or create items
      for (const item of items) {
        if (item.id && existingItemIds.includes(item.id)) {
          // Update existing item
          await tx.billItem.update({
            where: { id: item.id },
            data: {
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              amount: Number(item.amount),
            },
          });
        } else {
          // Create new item
          await tx.billItem.create({
            data: {
              billId: id,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              amount: Number(item.amount),
            },
          });
        }
      }

      return bill;
    });

    return NextResponse.json({
      message: "Bill updated successfully",
      bill: updatedBill,
    });
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { message: "Error updating bill", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint - cancel a bill
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user and check authentication
    const user = await auth();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get bill ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Bill ID is required" },
        { status: 400 }
      );
    }

    // Check if the bill exists
    const existingBill = await db.bill.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!existingBill) {
      return NextResponse.json(
        { message: "Bill not found" },
        { status: 404 }
      );
    }

    // Check if bill is paid or partially paid (can't cancel in those states)
    if (existingBill.status === "paid" || existingBill.status === "partially_paid") {
      return NextResponse.json(
        { message: "Paid or partially paid bills cannot be cancelled" },
        { status: 400 }
      );
    }

    // Mark the bill as cancelled in a transaction
    const cancelledBill = await db.bill.update({
      where: { id },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Bill cancelled successfully",
      bill: cancelledBill,
    });
  } catch (error) {
    console.error("Error cancelling bill:", error);
    return NextResponse.json(
      { message: "Error cancelling bill", error: error.message },
      { status: 500 }
    );
  }
} 