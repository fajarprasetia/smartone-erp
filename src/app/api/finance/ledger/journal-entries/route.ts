import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const period = searchParams.get("period");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (period) {
      where.periodId = period;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Get total count
    const totalCount = await db.journalEntry.count({ where });
    
    // Build sort options
    const orderBy: any = {};
    orderBy[sortBy] = sortDirection;
    
    // Query journal entries
    const entries = await db.journalEntry.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        period: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
    
    // Format data for the response
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date.toISOString(),
      periodId: entry.periodId,
      periodName: entry.period.name,
      description: entry.description,
      reference: entry.reference,
      status: entry.status,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      items: entry.items.map(item => ({
        id: item.id,
        journalEntryId: item.journalEntryId,
        accountId: item.accountId,
        accountCode: item.account.code,
        accountName: item.account.name,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
      })),
    }));
    
    // Get available filter options
    const [periods, statuses] = await Promise.all([
      db.financialPeriod.findMany({
        select: { id: true, name: true },
        orderBy: { startDate: "desc" },
      }),
      db.journalEntry.findMany({
        select: { status: true },
        distinct: ["status"],
      }),
    ]);
    
    return NextResponse.json({
      entries: formattedEntries,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
      filters: {
        periods: periods.map(p => p.name),
        statuses: statuses.map(s => s.status),
      },
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate data
    if (!data.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }
    
    if (!data.periodId) {
      return NextResponse.json(
        { error: "Period is required" },
        { status: 400 }
      );
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length < 2) {
      return NextResponse.json(
        { error: "At least two items are required" },
        { status: 400 }
      );
    }
    
    // Verify the period exists and is not closed
    const period = await db.financialPeriod.findUnique({
      where: { id: data.periodId }
    });
    
    if (!period) {
      return NextResponse.json(
        { error: "Financial period not found" },
        { status: 404 }
      );
    }
    
    if (period.isClosed) {
      return NextResponse.json(
        { error: "Cannot create entries in a closed period" },
        { status: 400 }
      );
    }
    
    // Calculate debits and credits to ensure they balance
    const totalDebit = data.items.reduce((sum: number, item: any) => sum + (Number(item.debit) || 0), 0);
    const totalCredit = data.items.reduce((sum: number, item: any) => sum + (Number(item.credit) || 0), 0);
    
    // Check if debits and credits balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({
        error: "Debits must equal credits",
        details: {
          totalDebits: totalDebit,
          totalCredits: totalCredit,
          difference: totalDebit - totalCredit
        }
      }, { status: 400 });
    }
    
    // Generate entry number (in real implementation, you might have a more sophisticated way)
    const entryNumber = data.entryNumber || `JE-${new Date().getTime().toString().slice(-8)}`;
    
    // Create journal entry with items
    const journalEntry = await db.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(data.date),
        periodId: data.periodId,
        description: data.description || "",
        reference: data.reference || "",
        status: "DRAFT", // Default status for new entries
        items: {
          create: data.items.map((item: any) => ({
            accountId: item.accountId,
            description: item.description || "",
            debit: Number(item.debit) || 0,
            credit: Number(item.credit) || 0,
          })),
        },
      },
      include: {
        items: {
          include: {
            account: true
          }
        },
        period: true
      },
    });
    
    // Format the response
    const formattedEntry = {
      id: journalEntry.id,
      entryNumber: journalEntry.entryNumber,
      date: journalEntry.date.toISOString(),
      periodId: journalEntry.periodId,
      periodName: journalEntry.period.name,
      description: journalEntry.description,
      reference: journalEntry.reference,
      status: journalEntry.status,
      items: journalEntry.items.map(item => ({
        id: item.id,
        journalEntryId: item.journalEntryId,
        accountId: item.accountId,
        accountCode: item.account.code,
        accountName: item.account.name,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
      })),
    };
    
    return NextResponse.json(formattedEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Get journal entry ID from query
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Journal entry ID is required" },
        { status: 400 }
      );
    }
    
    // Find the journal entry
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }
    
    // Check if entry can be edited
    if (existingEntry.status === "POSTED") {
      return NextResponse.json(
        { error: "Posted journal entries cannot be edited" },
        { status: 400 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate data
    if (!data.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }
    
    if (!data.periodId) {
      return NextResponse.json(
        { error: "Period is required" },
        { status: 400 }
      );
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length < 2) {
      return NextResponse.json(
        { error: "At least two items are required" },
        { status: 400 }
      );
    }
    
    // Calculate debits and credits to ensure they balance
    const totalDebit = data.items.reduce((sum: number, item: any) => sum + (Number(item.debit) || 0), 0);
    const totalCredit = data.items.reduce((sum: number, item: any) => sum + (Number(item.credit) || 0), 0);
    
    // Check if debits and credits balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: "Debits must equal credits" },
        { status: 400 }
      );
    }
    
    // Update journal entry
    const updatedEntry = await db.$transaction(async (prisma) => {
      // Delete existing items
      await prisma.journalEntryItem.deleteMany({
        where: { journalEntryId: id },
      });
      
      // Update journal entry and create new items
      return prisma.journalEntry.update({
        where: { id },
        data: {
          date: new Date(data.date),
          periodId: data.periodId,
          description: data.description,
          reference: data.reference,
          items: {
            create: data.items.map((item: any) => ({
              accountId: item.accountId,
              description: item.description,
              debit: Number(item.debit) || 0,
              credit: Number(item.credit) || 0,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    });
    
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return NextResponse.json(
      { error: "Failed to update journal entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Get journal entry ID from query
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Journal entry ID is required" },
        { status: 400 }
      );
    }
    
    // Find the journal entry
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }
    
    // Check if entry can be deleted
    if (existingEntry.status === "POSTED") {
      return NextResponse.json(
        { error: "Posted journal entries cannot be deleted" },
        { status: 400 }
      );
    }
    
    // Delete journal entry and its items
    await db.$transaction(async (prisma) => {
      // Delete items first (should cascade, but just to be sure)
      await prisma.journalEntryItem.deleteMany({
        where: { journalEntryId: id },
      });
      
      // Delete the journal entry
      await prisma.journalEntry.delete({
        where: { id },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return NextResponse.json(
      { error: "Failed to delete journal entry" },
      { status: 500 }
    );
  }
} 