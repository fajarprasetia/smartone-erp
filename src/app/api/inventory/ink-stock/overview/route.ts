import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get total count of ink stocks
    const totalStocks = await prisma.inkStock.count();
    
    // Get count of available ink stocks
    const availableStocks = await prisma.inkStock.count({
      where: {
        availability: "YES"
      }
    });
    
    // Get count of unavailable (out) ink stocks
    const stocksOut = await prisma.inkStock.count({
      where: {
        availability: "NO"
      }
    });
    
    // Get count of pending ink requests
    const pendingRequests = await prisma.inkRequest.count({
      where: {
        status: "PENDING"
      }
    });
    
    // Get count of recently added stocks (in the last 7 days)
    const recentlyAdded = await prisma.inkStock.count({
      where: {
        dateAdded: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Get color distribution
    const colorDistribution = await prisma.$queryRaw`
      SELECT 
        color as label, 
        COUNT(*) as count
      FROM ink_stocks
      GROUP BY color
      ORDER BY count DESC
      LIMIT 3
    `;
    
    const totalColorCount = await prisma.inkStock.count();
    
    // Calculate percentages for color distribution
    const topColors = (colorDistribution as any[]).map(item => ({
      label: item.label,
      count: Number(item.count),
      percentage: Math.round((Number(item.count) / totalColorCount) * 100)
    }));
    
    // Get supplier distribution
    const supplierDistribution = await prisma.$queryRaw`
      SELECT 
        COALESCE(supplier, 'Unknown') as label, 
        COUNT(*) as count
      FROM ink_stocks
      GROUP BY supplier
      ORDER BY count DESC
      LIMIT 3
    `;
    
    // Calculate percentages for supplier distribution
    const topSuppliers = (supplierDistribution as any[]).map(item => ({
      label: item.label,
      count: Number(item.count),
      percentage: Math.round((Number(item.count) / totalColorCount) * 100)
    }));
    
    return NextResponse.json({
      totalStocks,
      availableStocks,
      stocksOut,
      pendingRequests,
      recentlyAdded,
      topColors,
      supplierDistribution: topSuppliers
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching ink stocks overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch ink stocks overview" },
      { status: 500 }
    );
  }
} 