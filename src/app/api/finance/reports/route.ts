import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = new Date(searchParams.get("from") || "");
    const to = new Date(searchParams.get("to") || "");

    // Financial summary data
    const summary = {
      income: 0,
      expenses: 0,
      pendingPayables: 0,
      pendingReceivables: 0,
    };

    // Fetch accounts receivable data
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: from,
          lte: to,
        },
      },
    });

    // Calculate pending receivables
    invoices.forEach((invoice) => {
      if (invoice.status !== "PAID") {
        summary.pendingReceivables += invoice.balance;
      }
      summary.income += invoice.amountPaid;
    });

    // Fetch accounts payable data
    const bills = await prisma.bill.findMany({
      where: {
        issueDate: {
          gte: from,
          lte: to,
        },
      },
    });

    // Calculate pending payables and expenses
    bills.forEach((bill) => {
      if (bill.status !== "PAID") {
        summary.pendingPayables += (bill.totalAmount - bill.paidAmount);
      }
      summary.expenses += bill.paidAmount;
    });

    // Fetch tax data
    const taxFilings = await prisma.taxFiling.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });

    // Calculate additional data
    const cashFlow = summary.income - summary.expenses;
    
    return NextResponse.json({
      summary,
      cashFlow,
      data: {
        invoices,
        bills,
        taxFilings,
      },
    });
  } catch (error) {
    console.error("Error generating finance report:", error);
    return NextResponse.json(
      { error: "Failed to generate finance report" },
      { status: 500 }
    );
  }
}