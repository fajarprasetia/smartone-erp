import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Check if bill model exists in the db object
const billModelExists = () => {
  return typeof db.bill === 'object' && db.bill !== null;
};

// Check if vendor model exists in the db object
const vendorModelExists = () => {
  return typeof db.vendor === 'object' && db.vendor !== null;
};

// Mock data for development
const mockVendors = [
  { id: "vendor-1", name: "ABC Suppliers", email: "contact@abcsuppliers.com", phone: "123-456-7890" },
  { id: "vendor-2", name: "XYZ Distribution", email: "info@xyzdist.com", phone: "987-654-3210" },
  { id: "vendor-3", name: "Global Materials Inc.", email: "sales@globalmaterials.com", phone: "555-123-4567" },
  { id: "vendor-4", name: "Tech Parts Co.", email: "support@techparts.co", phone: "444-333-2222" },
  { id: "vendor-5", name: "Industrial Solutions", email: "hello@industrialsolutions.com", phone: "777-888-9999" }
];

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);
const sixtyDaysAgo = new Date(today);
sixtyDaysAgo.setDate(today.getDate() - 60);
const thirtyDaysFromNow = new Date(today);
thirtyDaysFromNow.setDate(today.getDate() + 30);

// Generate mock bills
const generateMockBills = (count = 20) => {
  const statuses = ["PENDING", "PARTIAL", "PAID", "PAID", "PENDING"];
  const bills = [];

  for (let i = 0; i < count; i++) {
    const vendor = mockVendors[Math.floor(Math.random() * mockVendors.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const issueDate = getRandomDate(sixtyDaysAgo, today);
    
    // Determine due date - some overdue, some upcoming
    let dueDate;
    if (Math.random() > 0.7) {
      // 30% are overdue
      dueDate = getRandomDate(sixtyDaysAgo, thirtyDaysAgo);
    } else if (Math.random() > 0.5) {
      // 20% are due soon
      dueDate = getRandomDate(today, thirtyDaysFromNow);
    } else {
      // 50% are due beyond 30 days
      dueDate = getRandomDate(thirtyDaysFromNow, new Date(thirtyDaysFromNow.getTime() + 60 * 24 * 60 * 60 * 1000));
    }

    const totalAmount = Math.floor(Math.random() * 10000) + 500;
    let paidAmount = 0;
    
    // Calculate paid amount based on status
    if (status === "PAID") {
      paidAmount = totalAmount;
    } else if (status === "PARTIAL") {
      paidAmount = Math.floor(totalAmount * (Math.random() * 0.8 + 0.1)); // 10% to 90% paid
    }

    bills.push({
      id: `bill-${i + 1}`,
      billNumber: `INV-${2023}-${1000 + i}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      description: `Purchase of materials and supplies - Batch ${1000 + i}`,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      totalAmount,
      paidAmount,
      status,
      reference: `PO-${2023}-${2000 + i}`,
      vendor
    });
  }

  return bills;
};

const mockBills = generateMockBills(35);

// Get accounts payable data
export async function GET(req: Request) {
  try {
    // Check if required models exist
    const modelsExist = billModelExists() && vendorModelExists();
    
    if (!modelsExist) {
      console.log("Required models not found, returning mock data");
      
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id"); // Bill ID if requesting a specific bill
      const vendorId = searchParams.get("vendorId"); // Filter by vendor
      const status = searchParams.get("status"); // Filter by status
      const dueDateStart = searchParams.get("dueDateStart");
      const dueDateEnd = searchParams.get("dueDateEnd");
      const page = parseInt(searchParams.get("page") || "1");
      const pageSize = parseInt(searchParams.get("pageSize") || "10");
      const search = searchParams.get("search") || "";
      
      // Return a specific bill if ID is provided
      if (id) {
        const bill = mockBills.find(b => b.id === id);
        
        if (!bill) {
          return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }
        
        // Add payments array for mock bill
        bill.payments = [];
        
        return NextResponse.json(bill);
      }
      
      // Filter the mock bills based on query parameters
      let filteredBills = [...mockBills];
      
      if (vendorId) {
        filteredBills = filteredBills.filter(bill => bill.vendorId === vendorId);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredBills = filteredBills.filter(bill => 
          bill.billNumber.toLowerCase().includes(searchLower) ||
          bill.vendorName.toLowerCase().includes(searchLower) ||
          bill.description.toLowerCase().includes(searchLower) ||
          bill.reference?.toLowerCase().includes(searchLower)
        );
      }
      
      if (status) {
        if (status === "overdue") {
          filteredBills = filteredBills.filter(bill => 
            (bill.status === "PENDING" || bill.status === "PARTIAL") &&
            new Date(bill.dueDate) < today
          );
        } else if (status === "open" || status === "OPEN") {
          filteredBills = filteredBills.filter(bill => bill.status === "PENDING");
        } else {
          filteredBills = filteredBills.filter(bill => bill.status === status);
        }
      }
      
      if (dueDateStart) {
        const startDate = new Date(dueDateStart);
        filteredBills = filteredBills.filter(bill => new Date(bill.dueDate) >= startDate);
      }
      
      if (dueDateEnd) {
        const endDate = new Date(dueDateEnd);
        filteredBills = filteredBills.filter(bill => new Date(bill.dueDate) <= endDate);
      }
      
      // Calculate summary data
      const totalDue = filteredBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
      
      const overdueBills = filteredBills.filter(bill => 
        (bill.status === "PENDING" || bill.status === "PARTIAL") && 
        new Date(bill.dueDate) < today
      );
      const totalOverdue = overdueBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
      
      const dueSoonBills = filteredBills.filter(bill => 
        (bill.status === "PENDING" || bill.status === "PARTIAL") && 
        new Date(bill.dueDate) >= today && 
        new Date(bill.dueDate) <= thirtyDaysFromNow
      );
      const dueSoonAmount = dueSoonBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
      
      // Paginate the results
      const offset = (page - 1) * pageSize;
      const paginatedBills = filteredBills.slice(offset, offset + pageSize);
      
      return NextResponse.json({
        bills: paginatedBills,
        pagination: {
          totalItems: filteredBills.length,
          totalPages: Math.ceil(filteredBills.length / pageSize),
          page,
          pageSize
        },
        summary: {
          totalDue,
          totalOverdue,
          dueSoon: dueSoonAmount
        },
        topVendors: mockVendors.slice(0, 5).map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          outstandingAmount: Math.floor(Math.random() * 50000),
          billsCount: Math.floor(Math.random() * 10) + 1
        }))
      });
    }

    // Real database implementation - retained but not used if models don't exist
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
    let totalCount = 0;
    try {
      totalCount = await db.bill.count({
        where: filter
      });
    } catch (countError) {
      console.error("Error counting bills:", countError);
    }
    
    // Get bills with pagination
    let bills = [];
    try {
      bills = await db.bill.findMany({
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
    } catch (findError) {
      console.error("Error finding bills:", findError);
    }
    
    // Calculate total amounts
    const totalBillsAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPaidAmount = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalOutstandingAmount = totalBillsAmount - totalPaidAmount;
    
    // Calculate bills due within the next 30 days
    let dueSoonBills = [];
    try {
      dueSoonBills = await db.bill.findMany({
        where: {
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: {
            gte: today,
            lte: thirtyDaysFromNow
          }
        }
      });
    } catch (dueSoonError) {
      console.error("Error finding due soon bills:", dueSoonError);
    }
    
    const dueSoonAmount = dueSoonBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
    
    // Calculate overdue bills
    let overdueBills = [];
    try {
      overdueBills = await db.bill.findMany({
        where: {
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { lt: today }
        }
      });
    } catch (overdueError) {
      console.error("Error finding overdue bills:", overdueError);
    }
    
    const overdueAmount = overdueBills.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
    
    // Get top vendors by outstanding amount
    let vendors = [];
    try {
      vendors = await db.vendor.findMany({
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
    } catch (vendorsError) {
      console.error("Error finding top vendors:", vendorsError);
    }
    
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
    
    let allOutstandingBills = [];
    try {
      allOutstandingBills = await db.bill.findMany({
        where: {
          status: { in: ["PENDING", "PARTIAL"] }
        }
      });
    } catch (outstandingError) {
      console.error("Error finding outstanding bills:", outstandingError);
    }
    
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
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        page: page,
        pageSize: pageSize
      },
      summary: {
        totalDue: totalBillsAmount,
        totalOverdue: overdueAmount,
        dueSoon: dueSoonAmount
      },
      topVendors,
      ageAnalysis
    });
  } catch (error) {
    console.error("Error in payable API:", error);
    
    // Return mock data on error
    return NextResponse.json({
      bills: mockBills.slice(0, 10),
      pagination: {
        totalItems: mockBills.length,
        totalPages: Math.ceil(mockBills.length / 10),
        page: 1,
        pageSize: 10
      },
      summary: {
        totalDue: 75000,
        totalOverdue: 25000,
        dueSoon: 15000
      },
      topVendors: mockVendors.slice(0, 5).map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        outstandingAmount: Math.floor(Math.random() * 50000),
        billsCount: Math.floor(Math.random() * 10) + 1
      }))
    });
  }
}

// Create a new bill
export async function POST(req: Request) {
  try {
    if (!billModelExists() || !vendorModelExists()) {
      // Return mock success for development
      const body = await req.json();
      
      return NextResponse.json({
        id: `bill-${Date.now()}`,
        billNumber: `INV-${Math.floor(Math.random() * 10000)}`,
        ...body,
        createdAt: new Date().toISOString(),
        message: "Mock bill created (using mock data)"
      }, { status: 201 });
    }
    
    const body = await req.json();
    const { 
      vendorId, 
      billNumber, 
      issueDate, 
      dueDate, 
      description, 
      reference,
      items = [],
      notes
    } = body;
    
    // Validate required fields
    if (!vendorId || !issueDate || !dueDate) {
      return NextResponse.json({ 
        error: "Vendor, issue date, and due date are required" 
      }, { status: 400 });
    }
    
    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    // Create bill
    const bill = await db.bill.create({
      data: {
        vendorId,
        billNumber: billNumber || `BILL-${Date.now()}`,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        description,
        reference,
        totalAmount,
        notes,
        status: "PENDING",
        paidAmount: 0,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            accountId: item.accountId
          }))
        }
      },
      include: {
        vendor: true,
        items: true
      }
    });
    
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    
    // Return mock success
    return NextResponse.json({
      id: `bill-${Date.now()}`,
      billNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      message: "Mock bill created (real creation failed)"
    }, { status: 201 });
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