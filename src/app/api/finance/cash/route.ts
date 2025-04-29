import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get cash flow data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    
    // Parse period into start and end dates
    let startDate = new Date();
    let currentDate = new Date();
    
    if (period === "week") {
      startDate.setDate(currentDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(currentDate.getMonth() - 1);
    } else if (period === "quarter") {
      startDate.setMonth(currentDate.getMonth() - 3);
    } else if (period === "year") {
      startDate.setFullYear(currentDate.getFullYear() - 1);
    } else if (period === "custom") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      
      if (from) {
        startDate = new Date(from);
      }
      
      if (to) {
        currentDate = new Date(to);
      }
    }
    
    // Get cash accounts and balances
    // Instead of using real data, we use mock data with the balance property
    const cashAccounts = [
      {
        id: "cash-1",
        name: "Main Cash Account",
        code: "1001",
        type: "ASSET",
        subtype: "Cash",
        balance: 25000000,
        isActive: true,
        description: "Primary cash account"
      },
      {
        id: "cash-2",
        name: "Petty Cash",
        code: "1002",
        type: "ASSET",
        subtype: "Cash",
        balance: 5000000,
        isActive: true,
        description: "Office petty cash"
      }
    ];
    
    const totalCashBalance = cashAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Mock transaction data instead of using real database records
    const mockTransactions = [
      {
        id: "trx-1",
        date: new Date(),
        description: "Customer payment for order #12345",
        amount: 5000000,
        type: "INCOME",
        category: "Sales",
        paymentMethod: "Bank Transfer",
        status: "COMPLETED"
      },
      {
        id: "trx-2",
        date: new Date(Date.now() - 86400000), // yesterday
        description: "Office supplies payment",
        amount: 750000,
        type: "EXPENSE",
        category: "Office Expenses",
        paymentMethod: "Cash",
        status: "COMPLETED"
      },
      {
        id: "trx-3",
        date: new Date(Date.now() - 172800000), // 2 days ago
        description: "Customer payment for order #12346",
        amount: 3500000,
        type: "INCOME",
        category: "Sales",
        paymentMethod: "Bank Transfer",
        status: "COMPLETED"
      }
    ];
    
    // Get recent transactions (both inflows and outflows) combined and sorted
    const recentTransactions = mockTransactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(transaction => ({
        id: transaction.id,
        transactionNumber: transaction.id.toUpperCase(),
        date: transaction.date.toISOString(),
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        account: null // Setting account to null
      }));
    
    // Mock cash flow data for the chart
    const cashFlowByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      // Generate some random data
      const inflow = Math.floor(Math.random() * 5000000) + 1000000;
      const outflow = Math.floor(Math.random() * 3000000) + 500000;
      
      return {
        date: dateStr,
        inflow,
        outflow,
        netFlow: inflow - outflow
      };
    }).reverse();
    
    // Mock summary data
    const totalInflows = 8500000;
    const totalOutflows = 3200000;
    const netCashFlow = totalInflows - totalOutflows;
    
    return NextResponse.json({
      summary: {
        totalCashBalance,
        periodInflows: totalInflows,
        periodOutflows: totalOutflows,
        netCashFlow,
        inflowCount: 2,
        outflowCount: 1
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
    
    // Return mock transaction data
    const mockTransaction = {
      id: `trx-${Date.now()}`,
      transactionNumber: `TRX-${Date.now()}`,
      type,
      amount: parseFloat(amount),
      description,
      category: category || null,
      date: new Date(date).toISOString(),
      status: "COMPLETED",
      paymentMethod: paymentMethod || null,
      referenceNumber: referenceNumber || null,
      accountId,
      notes: notes || null,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      transaction: mockTransaction
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ 
      error: "Failed to create transaction", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}