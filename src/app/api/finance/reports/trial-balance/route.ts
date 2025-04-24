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
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const asOfDate = searchParams.get("asOfDate");
    const periodId = searchParams.get("periodId");
    
    // Ensure at least one filter is provided
    if (!asOfDate && !periodId) {
      return NextResponse.json(
        { error: "Either asOfDate or periodId must be provided" },
        { status: 400 }
      );
    }
    
    let reportDate: Date;
    let periodName: string | undefined;
    
    // Handle date filtering
    if (asOfDate) {
      reportDate = new Date(asOfDate);
      
      // Validate date
      if (isNaN(reportDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
    } else if (periodId) {
      // Get period details to determine the end date
      const period = await db.financialPeriod.findUnique({
        where: { id: periodId }
      });
      
      if (!period) {
        return NextResponse.json(
          { error: "Period not found" },
          { status: 404 }
        );
      }
      
      reportDate = new Date(period.endDate);
      periodName = period.name;
    } else {
      // This should never happen due to earlier check
      reportDate = new Date();
    }
    
    // Get all accounts
    const accounts = await db.chartOfAccount.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { type: "asc" },
        { code: "asc" }
      ]
    });
    
    // Get journal entry items up to the specified date
    const journalItems = await db.journalEntryItem.findMany({
      where: {
        journalEntry: {
          status: "POSTED",
          date: {
            lte: reportDate
          }
        }
      },
      include: {
        journalEntry: {
          select: {
            date: true,
            status: true
          }
        },
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true
          }
        }
      }
    });
    
    // Calculate trial balance
    const accountBalances = new Map<string, { 
      id: string;
      code: string;
      name: string;
      type: string;
      debit: number;
      credit: number;
      balance: number;
      isDebit: boolean;
    }>();
    
    // Initialize with all accounts having zero balance
    accounts.forEach(account => {
      accountBalances.set(account.id, {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: 0,
        credit: 0,
        balance: 0,
        isDebit: ["ASSET", "EXPENSE"].includes(account.type)
      });
    });
    
    // Process journal entry items
    journalItems.forEach(item => {
      if (!accountBalances.has(item.accountId)) return;
      
      const accountBalance = accountBalances.get(item.accountId)!;
      
      // Update debits and credits
      accountBalance.debit += item.debit;
      accountBalance.credit += item.credit;
      
      // Calculate net balance based on account type
      const netAmount = item.debit - item.credit;
      
      if (["ASSET", "EXPENSE"].includes(accountBalance.type)) {
        // Debit accounts (assets, expenses)
        accountBalance.balance += netAmount;
        accountBalance.isDebit = accountBalance.balance >= 0;
      } else {
        // Credit accounts (liabilities, equity, revenue)
        accountBalance.balance -= netAmount;
        accountBalance.isDebit = accountBalance.balance < 0;
      }
      
      accountBalances.set(item.accountId, accountBalance);
    });
    
    // Convert to array and filter out accounts with zero balance (optional)
    const trialBalanceAccounts = Array.from(accountBalances.values())
      // Uncomment to filter zero balances
      // .filter(account => account.balance !== 0);
    
    // Calculate totals
    const totalDebit = trialBalanceAccounts.reduce((sum, account) => {
      // For debit normal accounts with positive balance, or credit normal with negative
      if ((account.isDebit && account.balance > 0) || (!account.isDebit && account.balance < 0)) {
        return sum + Math.abs(account.balance);
      }
      return sum;
    }, 0);
    
    const totalCredit = trialBalanceAccounts.reduce((sum, account) => {
      // For credit normal accounts with positive balance, or debit normal with negative
      if ((!account.isDebit && account.balance > 0) || (account.isDebit && account.balance < 0)) {
        return sum + Math.abs(account.balance);
      }
      return sum;
    }, 0);

    // Prepare final data structure
    const trialBalanceData = {
      accounts: trialBalanceAccounts.map(account => {
        const finalDebit = (account.isDebit && account.balance > 0) || (!account.isDebit && account.balance < 0)
          ? Math.abs(account.balance)
          : 0;
          
        const finalCredit = (!account.isDebit && account.balance > 0) || (account.isDebit && account.balance < 0)
          ? Math.abs(account.balance)
          : 0;
          
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debit: finalDebit,
          credit: finalCredit,
          balance: account.balance,
          isDebit: account.isDebit
        };
      }),
      totals: {
        debit: totalDebit,
        credit: totalCredit
      },
      asOfDate: reportDate.toISOString(),
      periodId: periodId || undefined,
      periodName: periodName || undefined
    };
    
    return NextResponse.json(trialBalanceData);
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return NextResponse.json(
      { error: "Failed to generate trial balance" },
      { status: 500 }
    );
  }
} 