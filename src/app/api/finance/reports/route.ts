import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Aggregate total sales (sum of nominal_total) from orders
    const totalSales = await db.order.aggregate({
      _sum: { nominal_total: true }
    });

    // Aggregate total receivables (sum of sisa) from orders
    const totalReceivables = await db.order.aggregate({
      _sum: { sisa: true }
    });

    // Aggregate total payments (sum of amount) from FinancialTransaction
    const totalPayments = await db.financialTransaction.aggregate({
      _sum: { amount: true }
    });

    // Count total orders
    const totalOrders = await db.order.count();

    // Count total financial transactions
    const totalTransactions = await db.financialTransaction.count();

    return NextResponse.json({
      totalSales: totalSales._sum.nominal_total || 0,
      totalReceivables: totalReceivables._sum.sisa || 0,
      totalPayments: totalPayments._sum.amount || 0,
      totalOrders,
      totalTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate finance reports", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}