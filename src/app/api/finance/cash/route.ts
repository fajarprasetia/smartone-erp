import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get cash flow data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // day, week, month, quarter, year
    const accountId = searchParams.get("accountId"); // Optional specific account
    
    const currentDate = new Date();
    let startDate: Date;
    
    // Set the date range based on the requested period
    switch (period) {
      case "day":
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 1);
        break;
      case "week":
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1);
        break;
      case "quarter":
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 3);
        break;
      case "year":
        startDate = new Date(currentDate);
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1); // Default to month
    }
    
    // Base query conditions
    const baseConditions: any = {
      date: {
        gte: startDate,
        lte: currentDate
      }
    };
    
    // Add account filter if specified
    if (accountId && accountId !== "ALL") {
      baseConditions.userId = accountId; // Using userId instead of accountId since it seems the relationship is through userId
    }
    
    // Get cash inflows (income transactions)
    const inflows = await db.financialTransaction.findMany({
      where: {
        ...baseConditions,
        type: "INCOME"
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Get cash outflows (expense transactions)
    const outflows = await db.financialTransaction.findMany({
      where: {
        ...baseConditions,
        type: "EXPENSE"
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Calculate totals
    const totalInflows = inflows.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalOutflows = outflows.reduce((sum, transaction) => sum + transaction.amount, 0);
    const netCashFlow = totalInflows - totalOutflows;
    
    // Get cash accounts and balances
    const cashAccounts = await db.chartOfAccount.findMany({
      where: {
        type: "ASSET",
        subtype: {
          contains: "Cash"
        }
      }
    });
    
    const totalCashBalance = cashAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Get recent transactions (both inflows and outflows) combined and sorted
    const recentTransactions = [...inflows, ...outflows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10) // Limit to 10 recent transactions
      .map(transaction => ({
        id: transaction.id,
        transactionNumber: transaction.id.substring(0, 8).toUpperCase(),
        date: transaction.date.toISOString(),
        description: transaction.description || "",
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category || "",
        paymentMethod: transaction.paymentMethod || null,
        status: "COMPLETED",
        account: null // Setting account to null since we no longer include it
      }));
    
    // Get cash flow by day for the chart
    const dayCount = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const days = Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    });
    
    const cashFlowByDay = await Promise.all(days.map(async (day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayInflows = await db.financialTransaction.aggregate({
        where: {
          type: "INCOME",
          date: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        _sum: {
          amount: true
        }
      });
      
      const dayOutflows = await db.financialTransaction.aggregate({
        where: {
          type: "EXPENSE",
          date: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        _sum: {
          amount: true
        }
      });
      
      return {
        date: dayStart.toISOString().slice(0, 10),
        inflow: dayInflows._sum.amount || 0,
        outflow: dayOutflows._sum.amount || 0,
        netFlow: (dayInflows._sum.amount || 0) - (dayOutflows._sum.amount || 0)
      };
    }));
    
    return NextResponse.json({
      summary: {
        totalCashBalance,
        periodInflows: totalInflows,
        periodOutflows: totalOutflows,
        netCashFlow,
        inflowCount: inflows.length,
        outflowCount: outflows.length
      },
      cashAccounts,
      recentTransactions,
      cashFlowByDay
    });
    
  } catch (error) {
    console.error("Error fetching cash flow data:", error);
    return NextResponse.json({ 
      error: "Failed to fetch cash flow data", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Create a new transaction
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      type,
      amount,
      description,
      category,
      date,
      paymentMethod,
      referenceNumber,
      accountId,
      notes
    } = data;
    
    // Validate required fields
    if (!type || amount === undefined || !description || !date || !accountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Create the transaction
    const transaction = await db.financialTransaction.create({
      data: {
        transactionNumber: `TRX-${Date.now()}`,
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: new Date(date),
        status: "COMPLETED",
        paymentMethod,
        referenceNumber,
        accountId,
        notes
      }
    });
    
    // Update account balance
    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId }
    });
    
    if (account) {
      let newBalance = account.balance;
      
      if (type === "INCOME") {
        newBalance += parseFloat(amount);
      } else if (type === "EXPENSE") {
        newBalance -= parseFloat(amount);
      }
      
      await db.chartOfAccount.update({
        where: { id: accountId },
        data: {
          balance: newBalance
        }
      });
    }
    
    // Create journal entry
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
            entryNumber: `JE-TRX-${transaction.id}`,
            date: new Date(),
            description: `Transaction: ${description}`,
            reference: referenceNumber,
            status: "POSTED",
            periodId: currentPeriod.id,
          }
        });
        
        // Get or create revenue/expense account depending on type
        let offsetAccountId: string;
        
        if (type === "INCOME") {
          const revenueAccount = await db.chartOfAccount.findFirst({
            where: {
              type: "REVENUE",
              subtype: category || "Other Income"
            }
          });
          
          offsetAccountId = revenueAccount?.id || account.id;
        } else {
          const expenseAccount = await db.chartOfAccount.findFirst({
            where: {
              type: "EXPENSE",
              subtype: category || "Other Expense"
            }
          });
          
          offsetAccountId = expenseAccount?.id || account.id;
        }
        
        // Create journal entry items
        if (type === "INCOME") {
          // Debit Cash
          await db.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: accountId,
              description: `Cash received: ${description}`,
              debit: parseFloat(amount),
              credit: 0
            }
          });
          
          // Credit Revenue
          await db.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: offsetAccountId,
              description: `Revenue: ${description}`,
              debit: 0,
              credit: parseFloat(amount)
            }
          });
        } else if (type === "EXPENSE") {
          // Debit Expense
          await db.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: offsetAccountId,
              description: `Expense: ${description}`,
              debit: parseFloat(amount),
              credit: 0
            }
          });
          
          // Credit Cash
          await db.journalEntryItem.create({
            data: {
              journalEntryId: journalEntry.id,
              accountId: accountId,
              description: `Cash payment: ${description}`,
              debit: 0,
              credit: parseFloat(amount)
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
      transaction
    });
    
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ 
      error: "Failed to create transaction", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}