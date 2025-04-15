import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get total count of paper stocks
    const totalStocks = await prisma.paperStock.count();
    
    // Get count of available paper stocks
    const availableStocks = await prisma.paperStock.count({
      where: {
        availability: "YES"
      }
    });
    
    // Get count of unavailable (out) paper stocks
    const stocksOut = await prisma.paperStock.count({
      where: {
        availability: "NO"
      }
    });
    
    // Get count of pending paper requests
    const pendingRequests = await prisma.paperRequest.count({
      where: {
        status: "PENDING"
      }
    });
    
    // Get count of recently added stocks (in the last 7 days)
    const recentlyAdded = await prisma.paperStock.count({
      where: {
        dateAdded: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Get GSM distribution
    const gsmDistribution = await prisma.$queryRaw`
      SELECT 
        gsm::text || ' GSM' as label, 
        COUNT(*) as count
      FROM paper_stocks
      GROUP BY gsm
      ORDER BY count DESC
      LIMIT 3
    `;
    
    const totalGsmCount = await prisma.paperStock.count();
    
    // Calculate percentages for GSM distribution
    const topGSM = (gsmDistribution as any[]).map(item => ({
      label: item.label,
      count: Number(item.count),
      percentage: Math.round((Number(item.count) / totalGsmCount) * 100)
    }));
    
    // Get supplier distribution
    const supplierDistribution = await prisma.$queryRaw`
      SELECT 
        COALESCE(manufacturer, 'Unknown') as label, 
        COUNT(*) as count
      FROM paper_stocks
      GROUP BY manufacturer
      ORDER BY count DESC
      LIMIT 3
    `;
    
    // Calculate percentages for supplier distribution
    const topSuppliers = (supplierDistribution as any[]).map(item => ({
      label: item.label,
      count: Number(item.count),
      percentage: Math.round((Number(item.count) / totalGsmCount) * 100)
    }));
    
    return NextResponse.json({
      totalStocks,
      availableStocks,
      stocksOut,
      pendingRequests,
      recentlyAdded,
      topGSM,
      supplierDistribution: topSuppliers
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching paper stocks overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper stocks overview" },
      { status: 500 }
    );
  }
} 