import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, isAfter, isBefore, parseISO, subDays } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for bill creation
const createBillSchema = z.object({
  vendorId: z.string(),
  billNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  amount: z.number(),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    accountId: z.string().optional(),
    taxRate: z.number().optional(),
  })),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    
    // Get pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const vendorId = url.searchParams.get("vendorId");
    const status = url.searchParams.get("status");
    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");
    const tab = url.searchParams.get("tab") || "overview";
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Prepare filter conditions
    let whereCondition: any = {};
    
    // Add search condition if search term is provided
    if (search) {
      whereCondition.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Add vendor filter if provided
    if (vendorId) {
      whereCondition.vendorId = vendorId;
    }
    
    // Status filter
    if (status) {
      whereCondition.status = status;
    } else if (tab === "unpaid") {
      whereCondition.status = "UNPAID";
    } else if (tab === "overdue") {
      whereCondition.OR = [
        { 
          AND: [
            { status: "UNPAID" },
            { dueDate: { lt: new Date() } }
          ]
        },
        { status: "OVERDUE" }
      ];
    }
    
    // Date range filter
    if (fromDate) {
      whereCondition.issueDate = {
        ...(whereCondition.issueDate || {}),
        gte: new Date(fromDate)
      };
    }
    
    if (toDate) {
      whereCondition.issueDate = {
        ...(whereCondition.issueDate || {}),
        lte: new Date(toDate)
      };
    }
    
    // Check if db.bill exists before accessing count method
    if (!db.bill) {
      console.error("Bill model not found in database client");
      return NextResponse.json({ 
        bills: [],
        summary: {
          totalPayable: 0,
          overdue: 0,
          dueSoon: 0,
          overdueCount: 0,
          dueSoonCount: 0,
          vendorCount: 0,
          newVendorCount: 0
        },
        totalCount: 0,
        pageCount: 0,
        vendors: []
      });
    }
    
    // Get total count for pagination
    let totalCount = 0;
    try {
      totalCount = await db.bill.count({
        where: whereCondition
      });
    } catch (countError) {
      console.error("Error counting bills:", countError);
      // Continue with zero count
    }
    
    // Get bills with pagination
    let bills: any[] = [];
    try {
      bills = await db.bill.findMany({
        where: whereCondition,
        include: {
          vendor: true,
          payments: true,
          items: true
        },
        orderBy: {
          issueDate: 'desc'
        },
        skip,
        take: pageSize
      });
    } catch (findError) {
      console.error("Error finding bills:", findError);
      // Continue with empty bills array
    }
    
    // Prepare data for client
    const processedBills = bills.map(bill => {
      // Calculate paid amount and remaining amount
      const paidAmount = bill.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
      const remainingAmount = bill.totalAmount - paidAmount;
      
      // Determine status based on dueDate and payments
      let status = bill.status;
      if (status === "UNPAID" && isAfter(new Date(), new Date(bill.dueDate))) {
        status = "OVERDUE";
      }
      
      return {
        id: bill.id,
        billNumber: bill.billNumber,
        vendorId: bill.vendorId,
        vendorName: bill.vendor?.name || "Unknown Vendor",
        issueDate: bill.issueDate.toISOString(),
        dueDate: bill.dueDate.toISOString(),
        totalAmount: bill.totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        status: paidAmount === 0 ? (status === "UNPAID" ? status : "OVERDUE") : 
                paidAmount < bill.totalAmount ? "PARTIAL" : "PAID",
        description: bill.description || "",
        reference: bill.reference || "",
        attachmentUrl: bill.attachmentUrl || null
      };
    });
    
    // Get summary data
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);
    
    // Initialize with default values
    let overdueBills: any[] = [];
    let dueSoonBills: any[] = [];
    let vendorCount = 0;
    let newVendorCount = 0;
    let vendors: any[] = [];

    try {
      // Count overdue bills
      overdueBills = await db.bill.findMany({
        where: {
          AND: [
            { status: "UNPAID" },
            { dueDate: { lt: today } }
          ]
        },
        include: {
          payments: true
        }
      });
      
      // Count bills due in the next 7 days
      dueSoonBills = await db.bill.findMany({
        where: {
          AND: [
            { status: "UNPAID" },
            { dueDate: { gte: today, lte: sevenDaysFromNow } }
          ]
        },
        include: {
          payments: true
        }
      });
      
      // Get vendor counts
      vendorCount = await db.vendor.count({
        where: {
          status: "ACTIVE"
        }
      });
      
      // Get new vendors in the last 30 days
      const thirtyDaysAgo = subDays(today, 30);
      newVendorCount = await db.vendor.count({
        where: {
          status: "ACTIVE",
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });
      
      // Get all vendors for filtering
      vendors = await db.vendor.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    } catch (summaryError) {
      console.error("Error getting summary data:", summaryError);
      // Continue with default values
    }
    
    // Calculate total outstanding, overdue, and due soon amounts
    const totalPayable = processedBills.reduce((sum, bill) => {
      return sum + (bill.status !== "PAID" ? bill.remainingAmount : 0);
    }, 0);
    
    const overdueAmount = overdueBills.reduce((sum: number, bill: any) => {
      const paidAmount = bill.payments?.reduce((pSum: number, payment: any) => pSum + payment.amount, 0) || 0;
      return sum + (bill.totalAmount - paidAmount);
    }, 0);
    
    const dueSoonAmount = dueSoonBills.reduce((sum: number, bill: any) => {
      const paidAmount = bill.payments?.reduce((pSum: number, payment: any) => pSum + payment.amount, 0) || 0;
      return sum + (bill.totalAmount - paidAmount);
    }, 0);
    
    // Prepare response
    const response = {
      bills: processedBills,
      summary: {
        totalPayable,
        overdue: overdueAmount,
        dueSoon: dueSoonAmount,
        overdueCount: overdueBills.length,
        dueSoonCount: dueSoonBills.length,
        vendorCount,
        newVendorCount
      },
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize) || 1,
      vendors
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching payable data:", error);
    // Return a default response structure to avoid client-side errors
    return NextResponse.json({ 
      bills: [],
      summary: {
        totalPayable: 0,
        overdue: 0,
        dueSoon: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        vendorCount: 0,
        newVendorCount: 0
      },
      totalCount: 0,
      pageCount: 1,
      vendors: [],
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Create a bill
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createBillSchema.parse(body);

    // Calculate total amount from items
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100),
      0
    );

    const bill = await prisma.bill.create({
      data: {
        billNumber: validatedData.billNumber,
        vendorId: validatedData.vendorId,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        amount: totalAmount,
        totalAmount,
        status: "UNPAID",
        description: validatedData.description,
        items: {
          create: validatedData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100),
            accountId: item.accountId,
            taxRate: item.taxRate || 0,
          })),
        },
      },
      include: {
        vendor: true,
        items: true,
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error creating bill:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 