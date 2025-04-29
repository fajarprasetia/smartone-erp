import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get total items count
    const totalStocks = await prisma.othersItem.count()

    // Get available items count (where quantity > 0)
    const availableStocks = await prisma.othersItem.count({
      where: {
        quantity: {
          gt: 0
        }
      }
    })

    // Get out of stock items count (where quantity = 0)
    const stocksOut = await prisma.othersItem.count({
      where: {
        quantity: 0
      }
    })

    // Get pending requests count
    const pendingRequests = await prisma.othersRequest.count({
      where: {
        status: "PENDING"
      }
    })

    // Get recently added items count (last 7 days)
    const recentlyAdded = await prisma.othersItem.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    // Get category distribution
    const categoryDistribution = await prisma.othersItem.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    })

    // Calculate percentages for distributions, handling case where totalStocks is 0
    const categoryDistributionWithPercentage = categoryDistribution.map(item => ({
      label: item.category,
      count: item._count.category,
      percentage: totalStocks > 0 ? (item._count.category / totalStocks) * 100 : 0
    }))

    return NextResponse.json({
      totalStocks,
      availableStocks,
      stocksOut,
      pendingRequests,
      recentlyAdded,
      categoryDistribution: categoryDistributionWithPercentage
    })
  } catch (error) {
    console.error("Error fetching others stock overview:", error)
    return NextResponse.json(
      { error: "Failed to fetch others stock overview" },
      { status: 500 }
    )
  }
} 