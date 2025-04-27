import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = new Date(searchParams.get("from") || "");
    const to = new Date(searchParams.get("to") || "");

    // Fetch cash flow data
    const cashTransactions = await prisma.cashTransaction.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
    });

    const inflow = cashTransactions
      .filter((t) => t.type === "INFLOW")
      .reduce((sum, t) => sum + t.amount, 0);

    const outflow = cashTransactions
      .filter((t) => t.type === "OUTFLOW")
      .reduce((sum, t) => sum + t.amount, 0);

    // Fetch accounts receivable data
    const receivables = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: from,
          lte: to,
        },
      },
    });

    const receivablesTotal = receivables.reduce((sum, inv) => sum + inv.balance, 0);
    const overdueReceivables = receivables
      .filter((inv) => new Date(inv.dueDate) < new Date() && inv.status !== "PAID")
      .reduce((sum, inv) => sum + inv.balance, 0);

    // Fetch accounts payable data
    const payables = await prisma.bill.findMany({
      where: {
        issueDate: {
          gte: from,
          lte: to,
        },
      },
    });

    const payablesTotal = payables.reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
    const overduePayables = payables
      .filter((bill) => new Date(bill.dueDate) < new Date() && bill.status !== "PAID")
      .reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);

    // Fetch tax data
    const taxFilings = await prisma.taxFiling.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });

    const pendingTaxes = taxFilings
      .filter((tax) => tax.status === "pending")
      .reduce((sum, tax) => sum + tax.amount, 0);
    const paidTaxes = taxFilings
      .filter((tax) => tax.status === "paid")
      .reduce((sum, tax) => sum + tax.amount, 0);
    const overdueTaxes = taxFilings
      .filter((tax) => new Date(tax.dueDate) < new Date() && tax.status === "pending")
      .reduce((sum, tax) => sum + tax.amount, 0);

    // Calculate revenue by month
    const months = [];
    let currentDate = new Date(from);
    while (currentDate <= to) {
      const startOfMonthDate = startOfMonth(currentDate);
      const endOfMonthDate = endOfMonth(currentDate);

      const monthlyInvoices = await prisma.invoice.findMany({
        where: {
          invoiceDate: {
            gte: startOfMonthDate,
            lte: endOfMonthDate,
          },
        },
      });

      const monthlyBills = await prisma.bill.findMany({
        where: {
          issueDate: {
            gte: startOfMonthDate,
            lte: endOfMonthDate,
          },
        },
      });

      months.push({
        month: format(currentDate, "MMM yyyy"),
        revenue: monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0),
        expenses: monthlyBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      });

      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }

    // Calculate expenses by category
    const billItems = await prisma.billItem.findMany({
      where: {
        bill: {
          issueDate: {
            gte: from,
            lte: to,
          },
        },
      },
      include: {
        account: true,
      },
    });

    const expensesByCategory = billItems.reduce((acc, item) => {
      const category = item.account?.type || "Uncategorized";
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += item.amount;
      return acc;
    }, {} as Record<string, number>);

    const expenseCategories = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));

    return NextResponse.json({
      cashFlow: {
        inflow,
        outflow,
        balance: inflow - outflow,
      },
      accountsReceivable: {
        total: receivablesTotal,
        overdue: overdueReceivables,
        upcoming: receivablesTotal - overdueReceivables,
      },
      accountsPayable: {
        total: payablesTotal,
        overdue: overduePayables,
        upcoming: payablesTotal - overduePayables,
      },
      taxes: {
        pending: pendingTaxes,
        paid: paidTaxes,
        overdue: overdueTaxes,
      },
      revenueByMonth: months,
      expensesByCategory: expenseCategories,
    });
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}