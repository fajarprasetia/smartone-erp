import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Count total orders and transactions
    const totalOrders = await db.order.count();
    const totalTransactions = await db.financialTransaction.count();
    
    // For string field nominal, fetch and calculate manually
    const orders = await db.order.findMany({
      select: {
        nominal: true
      }
    });
    
    // Calculate taxable sales (we'll use the nominal field as an approximation)
    let totalTaxableSales = 0;
    orders.forEach(order => {
      if (order.nominal) {
        const nominalValue = parseFloat(order.nominal);
        if (!isNaN(nominalValue)) {
          totalTaxableSales += nominalValue;
        }
      }
    });
    
    // For the tax collection, we'd need a specific tax field which may not exist
    // This is a placeholder - you would replace with actual tax data if available
    const totalTaxCollected = totalTaxableSales * 0.11; // Assuming 11% VAT
    
    return NextResponse.json({
      totalTaxableSales,
      totalTaxCollected,
      totalOrders,
      totalTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate tax management data", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}