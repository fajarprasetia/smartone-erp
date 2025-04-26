import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Count total orders
    const totalOrders = await db.order.count();

    // Count total financial transactions
    const totalTransactions = await db.financialTransaction.count();

    // Get sum of FinancialTransaction amounts
    const totalPayments = await db.financialTransaction.aggregate({
      _sum: { amount: true }
    });

    // For string fields like nominal and sisa, we need to fetch and calculate manually
    const orders = await db.order.findMany({
      select: {
        nominal: true,
        sisa: true
      }
    });

    // Calculate total sales and receivables from string fields
    let totalSales = 0;
    let totalReceivables = 0;

    orders.forEach(order => {
      // Parse nominal (sales)
      if (order.nominal) {
        const nominalValue = parseFloat(order.nominal);
        if (!isNaN(nominalValue)) {
          totalSales += nominalValue;
        }
      }

      // Parse sisa (receivables)
      if (order.sisa) {
        const sisaValue = parseFloat(order.sisa);
        if (!isNaN(sisaValue)) {
          totalReceivables += sisaValue;
        }
      }
    });

    return NextResponse.json({
      totalSales,
      totalReceivables,
      totalPayments: totalPayments._sum.amount || 0,
      totalOrders,
      totalTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate finance reports", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}