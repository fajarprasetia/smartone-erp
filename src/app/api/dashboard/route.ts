import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Mock data - in a real app, you would query your database
    const dashboardData = {
      // Overview data (revenue over time)
      overview: [
        { name: 'Jan', total: 1800 },
        { name: 'Feb', total: 2500 },
        { name: 'Mar', total: 3200 },
        { name: 'Apr', total: 4000 },
        { name: 'May', total: 3500 },
        { name: 'Jun', total: 2800 },
        { name: 'Jul', total: 3700 },
        { name: 'Aug', total: 4200 },
        { name: 'Sep', total: 4800 },
        { name: 'Oct', total: 5000 },
        { name: 'Nov', total: 5300 },
        { name: 'Dec', total: 5800 },
      ],
      
      // Revenue statistics
      revenue: {
        total: 85000,
        growthPercentage: 12.5
      },
      
      // Order statistics
      orders: {
        total: 265,
        growthPercentage: 8.2
      },
      
      // Production statistics
      production: {
        total: 125,
        inProgress: 42,
        completed: 83
      },
      
      // Customer statistics
      customers: {
        active: 312,
        growthPercentage: 18.7
      },
      
      // Recent sales data
      recentSales: [
        {
          id: "1",
          name: "Olivia Martin",
          email: "olivia.martin@email.com",
          amount: "$1,999.00",
          status: "success",
          date: "2023-04-30"
        },
        {
          id: "2",
          name: "Jackson Lee",
          email: "jackson.lee@email.com",
          amount: "$1,499.00",
          status: "pending",
          date: "2023-04-29"
        },
        {
          id: "3",
          name: "Isabella Nguyen",
          email: "isabella.nguyen@email.com",
          amount: "$2,499.00",
          status: "success",
          date: "2023-04-28"
        },
        {
          id: "4", 
          name: "William Kim",
          email: "will@email.com",
          amount: "$499.00",
          status: "success",
          date: "2023-04-28"
        },
        {
          id: "5",
          name: "Sofia Davis",
          email: "sofia.davis@email.com",
          amount: "$899.00",
          status: "failed",
          date: "2023-04-27"
        }
      ]
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 