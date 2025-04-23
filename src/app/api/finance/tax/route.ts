import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Aggregate tax-related data from orders and payments
    // Example: total taxable sales, total tax collected (assuming tax fields exist)
    const totalTaxableSales = await db.order.aggregate({ _sum: { nominal_total: true } });
    const totalTaxCollected = await db.financialTransaction.aggregate({ _sum: { tax: true } });
    const totalOrders = await db.order.count();
    const totalTransactions = await db.financialTransaction.count();
    return NextResponse.json({
      totalTaxableSales: totalTaxableSales._sum.nominal_total || 0,
      totalTaxCollected: totalTaxCollected._sum.tax || 0,
      totalOrders,
      totalTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate tax management data", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}