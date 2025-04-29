import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get general ledger data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // Journal entry ID if requesting a specific entry
    const accountId = searchParams.get("accountId"); // Filter by account
    const periodId = searchParams.get("periodId"); // Filter by financial period
    const status = searchParams.get("status"); // Filter by status (DRAFT, POSTED)
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // Return a specific journal entry if ID is provided
    if (id) {
      const journalEntry = await db.journalEntry.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              account: true
            }
          },
          period: true
        }
      });
      
      if (!journalEntry) {
        return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
      }
      
      return NextResponse.json(journalEntry);
    }
    
    // Build filter for journal entries list
    const filter: any = {};
    
    if (accountId) {
      filter.items = {
        some: {
          accountId
        }
      };
    }
    
    if (periodId) {
      filter.periodId = periodId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate) {
      filter.date = {
        ...(filter.date || {}),
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      filter.date = {
        ...(filter.date || {}),
        lte: new Date(endDate)
      };
    }
    
    // Get total count for pagination
    const totalCount = await db.journalEntry.count({
      where: filter
    });
    
    // Get journal entries with pagination
    const journalEntries = await db.journalEntry.findMany({
      where: filter,
      orderBy: {
        date: 'desc'
      },
      include: {
        items: {
          include: {
            account: true
          }
        },
        period: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    
    // Calculate total debits and credits
    const totalDebits = journalEntries.reduce((sum, entry) => {
      return sum + entry.items.reduce((entrySum, item) => entrySum + item.debit, 0);
    }, 0);
    
    const totalCredits = journalEntries.reduce((sum, entry) => {
      return sum + entry.items.reduce((entrySum, item) => entrySum + item.credit, 0);
    }, 0);
    
    // Get financial periods
    const financialPeriods = await db.financialPeriod.findMany({
      orderBy: {
        startDate: 'desc'
      }
    });
    
    // Count entries by status
    const draftEntriesCount = await db.journalEntry.count({
      where: { status: "DRAFT" }
    });
    
    const postedEntriesCount = await db.journalEntry.count({
      where: { status: "POSTED" }
    });
    
    // Get chart of accounts for reference
    const accounts = await db.chartOfAccount.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        code: 'asc'
      }
    });
    
    // Get the current open financial period
    const currentPeriod = await db.financialPeriod.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        status: "OPEN"
      }
    });
    
    return NextResponse.json({
      journalEntries,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize
      },
      summary: {
        totalDebits,
        totalCredits,
        draftEntriesCount,
        postedEntriesCount
      },
      accounts,
      financialPeriods,
      currentPeriod
    });
    
  } catch (error) {
    console.error("Error fetching general ledger data:", error);
    return NextResponse.json({ 
      error: "Failed to fetch general ledger data", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Create a new journal entry
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      date,
      description,
      reference,
      status,
      periodId,
      items = []
    } = data;
    
    // Validate required fields
    if (!date || !description || !periodId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Validate that debits equal credits
    const totalDebits = items.reduce((sum: number, item: any) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredits = items.reduce((sum: number, item: any) => sum + (parseFloat(item.credit) || 0), 0);
    
    // Check that debits equal credits (allowing for small floating point differences)
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json({
        error: "Journal entry must have equal debits and credits",
        details: {
          totalDebits,
          totalCredits,
          difference: totalDebits - totalCredits
        }
      }, { status: 400 });
    }
    
    // Generate a unique entry number
    const entryDate = new Date(date);
    const formatDate = `${entryDate.getFullYear()}${String(entryDate.getMonth() + 1).padStart(2, '0')}${String(entryDate.getDate()).padStart(2, '0')}`;
    const lastEntry = await db.journalEntry.findFirst({
      where: {
        entryNumber: {
          startsWith: `JE-${formatDate}-`
        }
      },
      orderBy: {
        entryNumber: 'desc'
      }
    });
    
    let entryNumber: string;
    if (lastEntry) {
      const lastNumber = parseInt(lastEntry.entryNumber.split('-').pop() || '0');
      entryNumber = `JE-${formatDate}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      entryNumber = `JE-${formatDate}-001`;
    }
    
    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Create the journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(date),
          description,
          reference,
          status: status || "DRAFT",
          periodId
        }
      });
      
      // Create the journal entry items
      for (const item of items) {
        await tx.journalEntryItem.create({
          data: {
            journalEntryId: journalEntry.id,
            accountId: item.accountId,
            description: item.description || description,
            debit: parseFloat(item.debit) || 0,
            credit: parseFloat(item.credit) || 0
          }
        });
        
        // Update account balances if entry is posted
        if (status === "POSTED") {
          const account = await tx.chartOfAccount.findUnique({
            where: { id: item.accountId }
          });
          
          if (account) {
            let newBalance = account.balance;
            
            if (account.type === "ASSET" || account.type === "EXPENSE") {
              // Debits increase assets and expenses
              newBalance += parseFloat(item.debit) || 0;
              newBalance -= parseFloat(item.credit) || 0;
            } else if (account.type === "LIABILITY" || account.type === "EQUITY" || account.type === "REVENUE") {
              // Credits increase liabilities, equity, and revenue
              newBalance -= parseFloat(item.debit) || 0;
              newBalance += parseFloat(item.credit) || 0;
            }
            
            await tx.chartOfAccount.update({
              where: { id: item.accountId },
              data: {
                balance: newBalance
              }
            });
          }
        }
      }
      
      // Return the created journal entry with items
      const createdEntry = await tx.journalEntry.findUnique({
        where: { id: journalEntry.id },
        include: {
          items: {
            include: {
              account: true
            }
          },
          period: true
        }
      });
      
      return NextResponse.json({
        success: true,
        journalEntry: createdEntry
      });
    });
    
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json({ 
      error: "Failed to create journal entry", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Update a journal entry
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const {
      id,
      date,
      description,
      reference,
      status,
      periodId,
      items = []
    } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Journal entry ID is required" }, { status: 400 });
    }
    
    // Get existing journal entry to check if it can be modified
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!existingEntry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }
    
    // Can't modify a posted entry unless changing to cancelled
    if (existingEntry.status === "POSTED" && status !== "CANCELLED") {
      return NextResponse.json({ 
        error: "Cannot modify a posted journal entry. Create a reversal entry instead." 
      }, { status: 400 });
    }
    
    // If updating items, validate that debits equal credits
    if (items.length > 0) {
      const totalDebits = items.reduce((sum: number, item: any) => sum + (parseFloat(item.debit) || 0), 0);
      const totalCredits = items.reduce((sum: number, item: any) => sum + (parseFloat(item.credit) || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return NextResponse.json({
          error: "Journal entry must have equal debits and credits",
          details: {
            totalDebits,
            totalCredits,
            difference: totalDebits - totalCredits
          }
        }, { status: 400 });
      }
    }
    
    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Update the journal entry
      const journalEntry = await tx.journalEntry.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(description && { description }),
          ...(reference !== undefined && { reference }),
          ...(status && { status }),
          ...(periodId && { periodId })
        }
      });
      
      // Update items if provided
      if (items.length > 0) {
        // Delete existing items
        await tx.journalEntryItem.deleteMany({
          where: { journalEntryId: id }
        });
        
        // Create new items
        for (const item of items) {
          await tx.journalEntryItem.create({
            data: {
              journalEntryId: id,
              accountId: item.accountId,
              description: item.description || description,
              debit: parseFloat(item.debit) || 0,
              credit: parseFloat(item.credit) || 0
            }
          });
          
          // Update account balances if entry status changed to POSTED
          if (existingEntry.status !== "POSTED" && status === "POSTED") {
            const account = await tx.chartOfAccount.findUnique({
              where: { id: item.accountId }
            });
            
            if (account) {
              let newBalance = account.balance;
              
              if (account.type === "ASSET" || account.type === "EXPENSE") {
                // Debits increase assets and expenses
                newBalance += parseFloat(item.debit) || 0;
                newBalance -= parseFloat(item.credit) || 0;
              } else if (account.type === "LIABILITY" || account.type === "EQUITY" || account.type === "REVENUE") {
                // Credits increase liabilities, equity, and revenue
                newBalance -= parseFloat(item.debit) || 0;
                newBalance += parseFloat(item.credit) || 0;
              }
              
              await tx.chartOfAccount.update({
                where: { id: item.accountId },
                data: {
                  balance: newBalance
                }
              });
            }
          }
        }
      }
      
      // Return the updated journal entry with items
      const updatedEntry = await tx.journalEntry.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              account: true
            }
          },
          period: true
        }
      });
      
      return NextResponse.json({
        success: true,
        journalEntry: updatedEntry
      });
    });
    
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return NextResponse.json({ 
      error: "Failed to update journal entry", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}