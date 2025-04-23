import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Create a new invoice
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      invoiceNumber, 
      invoiceDate, 
      dueDate, 
      status, 
      customerId, 
      orderId, 
      subtotal, 
      tax, 
      discount, 
      total, 
      amountPaid, 
      balance, 
      notes 
    } = data;

    // Validate required fields
    if (!invoiceNumber || !invoiceDate || !dueDate || !customerId || !subtotal || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if invoice with this number already exists
    const existingInvoice = await db.Invoice.findFirst({
      where: { invoiceNumber }
    });

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice with this number already exists" }, { status: 400 });
    }

    // Create the invoice
    const invoice = await db.Invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        status: status || "UNPAID",
        customerId: BigInt(customerId.toString()),
        orderId,
        subtotal,
        tax: tax || 0,
        discount: discount || 0,
        total,
        amountPaid: amountPaid || 0,
        balance: balance || total,
        notes,
      }
    });

    // Create a journal entry for this invoice
    try {
      // Get the current financial period
      const currentPeriod = await db.financialPeriod.findFirst({
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          isClosed: false
        }
      });

      if (currentPeriod) {
        // Create journal entry
        const journalEntry = await db.journalEntry.create({
          data: {
            entryNumber: `JE-INV-${invoiceNumber}`,
            date: new Date(),
            description: `Invoice created: ${invoiceNumber}`,
            reference: orderId ? `Order ${orderId}` : undefined,
            status: "POSTED",
            periodId: currentPeriod.id,
          }
        });

        // Get accounts for journal entry
        const accountsReceivable = await db.chartOfAccount.findFirst({
          where: {
            type: "ASSET",
            subtype: "Accounts Receivable"
          }
        });

        const salesRevenue = await db.chartOfAccount.findFirst({
          where: {
            type: "REVENUE",
            subtype: "Sales"
          }
        });

        // Create journal entry items if accounts exist
        if (accountsReceivable && salesRevenue) {
          // Debit Accounts Receivable
          await db.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: accountsReceivable.id,
              description: `Invoice ${invoiceNumber}`,
              debit: total,
              credit: 0
            }
          });

          // Credit Sales Revenue
          await db.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: salesRevenue.id,
              description: `Invoice ${invoiceNumber}`,
              debit: 0,
              credit: total
            }
          });
        }
      }
    } catch (journalError) {
      console.error("Error creating journal entry:", journalError);
      // Don't fail the whole request if journal entry creation fails
    }

    return NextResponse.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ 
      error: "Failed to create invoice", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Get invoices with filtering and pagination
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    // If an ID is provided, return a single invoice
    if (id) {
      const invoice = await db.Invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          order: true,
          transactions: true
        }
      });
      
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      
      return NextResponse.json(invoice);
    }
    
    // Otherwise, handle list request with filters and pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const orderId = searchParams.get("orderId");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "invoiceDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Build the filter
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (customerId) {
      filter.customerId = BigInt(customerId);
    }
    
    if (orderId) {
      filter.orderId = orderId;
    }
    
    if (search) {
      filter.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { 
          customer: {
            nama: { contains: search, mode: 'insensitive' }
          }
        },
        { 
          order: {
            spk: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }
    
    // Get the total count for pagination
    const totalCount = await db.Invoice.count({
      where: filter
    });
    
    // Get the invoices with pagination
    const invoices = await db.Invoice.findMany({
      where: filter,
      include: {
        customer: {
          select: {
            id: true,
            nama: true,
            telp: true
          }
        },
        order: {
          select: {
            id: true,
            spk: true,
            produk: true
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder
      }
    });
    
    return NextResponse.json({
      invoices,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize
      }
    });
    
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ 
      error: "Failed to fetch invoices", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Update an invoice
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }
    
    // Update the invoice
    const invoice = await db.Invoice.update({
      where: { id },
      data: { 
        ...updateData,
        // Convert dates if provided
        ...(updateData.invoiceDate && { invoiceDate: new Date(updateData.invoiceDate) }),
        ...(updateData.dueDate && { dueDate: new Date(updateData.dueDate) }),
        // Convert BigInt IDs if provided
        ...(updateData.customerId && { customerId: BigInt(updateData.customerId.toString()) })
      }
    });
    
    return NextResponse.json({
      success: true,
      invoice
    });
    
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ 
      error: "Failed to update invoice", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Delete an invoice (typically only for admin or special cases)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }
    
    // Check if the invoice has any transactions
    const hasTransactions = await db.financialTransaction.findFirst({
      where: { invoiceId: id }
    });
    
    if (hasTransactions) {
      return NextResponse.json({ 
        error: "Cannot delete an invoice with associated transactions" 
      }, { status: 400 });
    }
    
    // Delete the invoice
    await db.Invoice.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ 
      error: "Failed to delete invoice", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 