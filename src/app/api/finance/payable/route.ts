import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get accounts payable data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // Bill ID if requesting a specific bill
    const vendorId = searchParams.get("vendorId"); // Filter by vendor
    const status = searchParams.get("status"); // Filter by status (PENDING, PARTIAL, PAID, OVERDUE)
    const dueDateStart = searchParams.get("dueDateStart");
    const dueDateEnd = searchParams.get("dueDateEnd");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    
    // Return a specific bill if ID is provided
    if (id) {
      const bill = await db.bill.findUnique({
        where: { id },
        include: {
          vendor: true,
          items: true,
          payments: true
        }
      });
      
      if (!bill) {
        return NextResponse.json({ error: "Bill not found" }, { status: 404 });
      }
      
      return NextResponse.json(bill);
    }
    
    // Build filter for bills list
    const today = new Date();
    const filter: any = {};
    
    if (vendorId) {
      filter.vendorId = vendorId;
    }
    
    if (search) {
      filter.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { reference: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      switch (status) {
        case "PENDING":
          filter.status = "PENDING";
          break;
        case "PARTIAL":
          filter.status = "PARTIAL";
          break;
        case "PAID":
          filter.status = "PAID";
          break;
        case "OVERDUE":
          filter.dueDate = { lt: today };
          filter.status = { in: ["PENDING", "PARTIAL"] };
          break;
        default:
          break;
      }
    }
    
    if (dueDateStart) {
      filter.dueDate = {
        ...(filter.dueDate || {}),
        gte: new Date(dueDateStart)
      };
    }
    
    if (dueDateEnd) {
      filter.dueDate = {
        ...(filter.dueDate || {}),
        lte: new Date(dueDateEnd)
      };
    }
    
    // Get total count for pagination
    const totalCount = await db.bill.count({
      where: filter
    });
    
    // Get bills with pagination
    const bills = await db.bill.findMany({
      where: filter,
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        vendor: true,
        payments: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    
    // Calculate total amounts
    const totalBillsAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPaidAmount = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalOutstandingAmount = totalBillsAmount - totalPaidAmount;
    
    // Calculate bills due within the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const dueSoonBills = await db.bill.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      }
    });
    
    const dueSoonAmount = dueSoonBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
    
    // Calculate overdue bills
    const overdueBills = await db.bill.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { lt: today }
      }
    });
    
    const overdueAmount = overdueBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
    
    // Get top vendors by outstanding amount
    const vendors = await db.vendor.findMany({
      where: {
        bills: {
          some: {
            status: { in: ["PENDING", "PARTIAL"] }
          }
        }
      },
      include: {
        bills: {
          where: {
            status: { in: ["PENDING", "PARTIAL"] }
          }
        }
      },
      take: 5
    });
    
    const topVendors = vendors.map(vendor => {
      const outstandingAmount = vendor.bills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
      return {
        id: vendor.id,
        name: vendor.name,
        outstandingAmount,
        billsCount: vendor.bills.length
      };
    }).sort((a, b) => b.outstandingAmount - a.outstandingAmount);
    
    // Create age analysis (current, 1-30 days, 31-60 days, 61-90 days, 90+ days)
    const ageAnalysis = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0
    };
    
    const allOutstandingBills = await db.bill.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL"] }
      }
    });
    
    allOutstandingBills.forEach(bill => {
      const daysOverdue = bill.dueDate < today ? 
        Math.floor((today.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const outstandingAmount = bill.totalAmount - bill.paidAmount;
      
      if (daysOverdue === 0) {
        ageAnalysis.current += outstandingAmount;
      } else if (daysOverdue <= 30) {
        ageAnalysis["1-30"] += outstandingAmount;
      } else if (daysOverdue <= 60) {
        ageAnalysis["31-60"] += outstandingAmount;
      } else if (daysOverdue <= 90) {
        ageAnalysis["61-90"] += outstandingAmount;
      } else {
        ageAnalysis["90+"] += outstandingAmount;
      }
    });
    
    return NextResponse.json({
      bills,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize
      },
      summary: {
        totalBillsAmount,
        totalPaidAmount,
        totalOutstandingAmount,
        dueSoonAmount,
        overdueAmount,
        billsCount: totalCount,
        overdueCount: overdueBills.length,
        dueSoonCount: dueSoonBills.length
      },
      topVendors,
      ageAnalysis
    });
    
  } catch (error) {
    console.error("Error fetching accounts payable data:", error);
    return NextResponse.json({ 
      error: "Failed to fetch accounts payable data", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Create a new bill
export async function POST(req: Request) {
  try {
    const {
      vendorId,
      billNumber,
      billDate,
      dueDate,
      reference,
      description,
      notes,
      items,
      attachments
    } = await req.json();
    
    // Validate required fields
    if (!vendorId || !billNumber || !billDate || !dueDate || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if vendor exists
    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    
    // Check if bill number already exists
    const existingBill = await db.bill.findUnique({ where: { billNumber } });
    if (existingBill) {
      return NextResponse.json({ error: "Bill number already exists" }, { status: 400 });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      totalAmount += amount;
    }
    
    // Generate bill number if not provided
    let finalBillNumber = billNumber;
    if (!finalBillNumber) {
      const date = new Date();
      const billDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const lastBill = await db.bill.findFirst({
        where: {
          billNumber: {
            startsWith: `AP-${billDate}`
          }
        },
        orderBy: {
          billNumber: 'desc'
        }
      });
      
      let nextNumber = 1;
      if (lastBill) {
        const lastNumber = parseInt(lastBill.billNumber.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      finalBillNumber = `AP-${billDate}-${String(nextNumber).padStart(3, '0')}`;
    }
    
    // Create bill with transaction
    return await db.$transaction(async (tx) => {
      // Create the bill
      const bill = await tx.bill.create({
        data: {
          billNumber: finalBillNumber,
          vendorId,
          issueDate: new Date(billDate),
          dueDate: new Date(dueDate),
          amount: totalAmount,
          totalAmount,
          paidAmount: 0,
          status: "UNPAID",
          reference,
          description,
          notes
        }
      });
      
      // Create items for the bill
      const billItems = items.map(item => {
        return {
          billId: bill.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          accountId: item.accountId,
          taxRate: item.taxRate || 0
        };
      });
      
      // Create the bill items
      await Promise.all(billItems.map(item => tx.billItem.create({ data: item })));

      // Create attachments if provided
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await tx.attachment.create({
            data: {
              billId: bill.id,
              fileName: attachment.fileName,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize,
              fileUrl: attachment.fileUrl
            }
          });
        }
      }
      
      // Create financial transaction
      await tx.financialTransaction.create({
        data: {
          type: "AP",
          amount: totalAmount,
          description: `Bill #${finalBillNumber}`,
          date: new Date(billDate),
          billId: bill.id
        }
      });

      // Get chart of accounts for journal entry
      const periodId = (await tx.financialPeriod.findFirst({
        where: {
          startDate: { lte: new Date(billDate) },
          endDate: { gte: new Date(billDate) }
        },
        orderBy: { startDate: 'desc' }
      }))?.id;

      if (!periodId) {
        throw new Error("No active financial period found for this transaction date");
      }

      // Find AP account
      const apAccount = await tx.chartOfAccount.findFirst({
        where: {
          type: "LIABILITY",
          subtype: "ACCOUNTS_PAYABLE"
        }
      });

      if (!apAccount) {
        throw new Error("Accounts Payable account not found");
      }

      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNumber: `AP-${finalBillNumber}`,
          date: new Date(billDate),
          description: `Bill from ${(await tx.vendor.findUnique({ where: { id: vendorId } }))?.name} - ${finalBillNumber}`,
          reference: reference || finalBillNumber,
          status: "POSTED",
          periodId
        }
      });

      // Create credit entry (AP account)
      await tx.journalEntryItem.create({
        data: {
          journalEntryId: journalEntry.id,
          accountId: apAccount.id,
          description: `Bill from ${(await tx.vendor.findUnique({ where: { id: vendorId } }))?.name} - ${finalBillNumber}`,
          debit: 0,
          credit: totalAmount
        }
      });

      // Create debit entries for each expense
      for (const item of items) {
        if (item.accountId) {
          await tx.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: item.accountId,
              description: item.description,
              debit: parseFloat(item.quantity) * parseFloat(item.unitPrice),
              credit: 0
            }
          });
        }
      }
      
      // Update bill paid amount and status
      const newPaidAmount = bill.paidAmount + totalAmount;
      let newStatus: string;
      
      if (Math.abs(newPaidAmount - bill.totalAmount) < 0.01) { // Allow for small floating point differences
        newStatus = "PAID";
      } else if (newPaidAmount > 0) {
        newStatus = "PARTIAL";
      } else {
        newStatus = "PENDING";
      }
      
      await tx.bill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });
      
      // Return the created bill with items
      const createdBill = await tx.bill.findUnique({
        where: { id: bill.id },
        include: {
          vendor: true,
          items: true,
          payments: true,
          attachments: true
        }
      });
      
      return NextResponse.json({
        success: true,
        bill: createdBill
      });
    });
    
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json({ 
      error: "Failed to create bill", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Process a bill payment
export async function PUT(req: Request) {
  try {
    const { id, paymentAmount, paymentDate, paymentMethod, paymentReference, notes } = await req.json();
    
    if (!id || !paymentAmount || !paymentDate || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const bill = await db.bill.findUnique({
      where: { id },
      include: { vendor: true }
    });
    
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }
    
    return await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          billId: id,
          amount,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          paymentReference,
          notes
        }
      });
      
      // Create transaction record
      await tx.financialTransaction.create({
        data: {
          type: "PAYMENT",
          amount,
          description: `Payment for bill #${bill.billNumber}`,
          category: "ACCOUNTS_PAYABLE",
          date: new Date(paymentDate),
          billId: id
        }
      });
      
      // Update bill paid amount and status
      const newPaidAmount = bill.paidAmount + amount;
      let newStatus: string;
      
      if (Math.abs(newPaidAmount - bill.totalAmount) < 0.01) { // Allow for small floating point differences
        newStatus = "PAID";
      } else if (newPaidAmount > 0) {
        newStatus = "PARTIAL";
      } else {
        newStatus = "PENDING";
      }
      
      await tx.bill.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });
      
      // Return the updated bill with payments
      const updatedBill = await tx.bill.findUnique({
        where: { id },
        include: {
          vendor: true,
          payments: true
        }
      });
      
      return NextResponse.json(updatedBill);
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}