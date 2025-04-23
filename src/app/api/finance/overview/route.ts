import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get current date and calculate date 30 days ago for monthly comparison
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);

    // Get data for total revenue (from financial transactions of type INCOME)
    const totalRevenue = await db.financialTransaction.aggregate({
      where: {
        type: "INCOME",
      },
      _sum: { amount: true }
    });

    // Get revenue from last month for comparison
    const lastMonthRevenue = await db.financialTransaction.aggregate({
      where: {
        type: "INCOME",
        date: {
          gte: thirtyDaysAgo,
          lte: currentDate
        }
      },
      _sum: { amount: true }
    });

    const previousMonthRevenue = await db.financialTransaction.aggregate({
      where: {
        type: "INCOME",
        date: {
          gte: sixtyDaysAgo,
          lte: thirtyDaysAgo
        }
      },
      _sum: { amount: true }
    });

    // Calculate revenue change percentage
    const currentMonthRevenue = lastMonthRevenue._sum.amount || 0;
    const prevMonthRevenue = previousMonthRevenue._sum.amount || 0;
    const revenueChangePercentage = prevMonthRevenue > 0
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0;

    // Get data for orders
    const totalOrders = await db.order.count();
    const lastMonthOrders = await db.order.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
          lte: currentDate
        }
      }
    });
    
    const previousMonthOrders = await db.order.count({
      where: {
        created_at: {
          gte: sixtyDaysAgo,
          lte: thirtyDaysAgo
        }
      }
    });
    
    const ordersChangePercentage = previousMonthOrders > 0
      ? ((lastMonthOrders - previousMonthOrders) / previousMonthOrders) * 100
      : 0;

    // Get data for payments
    const totalPayments = await db.financialTransaction.count({
      where: {
        type: "INCOME"
      }
    });
    
    const lastMonthPayments = await db.financialTransaction.count({
      where: {
        type: "INCOME",
        date: {
          gte: thirtyDaysAgo,
          lte: currentDate
        }
      }
    });
    
    const previousMonthPayments = await db.financialTransaction.count({
      where: {
        type: "INCOME",
        date: {
          gte: sixtyDaysAgo,
          lte: thirtyDaysAgo
        }
      }
    });
    
    const paymentsChangePercentage = previousMonthPayments > 0
      ? ((lastMonthPayments - previousMonthPayments) / previousMonthPayments) * 100
      : 0;

    // Get accounts receivable (unpaid invoices) - Fixed to use Invoice model
    const accountsReceivable = await db.Invoice.aggregate({
      where: {
        status: {
          in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"]
        }
      },
      _sum: { balance: true }
    });

    // Generate monthly revenue data for chart
    const currentYear = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    const revenueByMonth = await Promise.all(
      months.map(async (month) => {
        const startDate = new Date(currentYear, month, 1);
        const endDate = new Date(currentYear, month + 1, 0);
        
        const monthRevenue = await db.financialTransaction.aggregate({
          where: {
            type: "INCOME",
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: { amount: true }
        });
        
        return {
          month: month + 1, // 1-indexed month
          revenue: monthRevenue._sum.amount || 0
        };
      })
    );

    // Get recent orders for the dashboard
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        customer: {
          select: {
            nama: true
          }
        }
      }
    });

    return NextResponse.json({
      overview: {
        totalRevenue: totalRevenue._sum.amount || 0,
        revenueChangePercentage: parseFloat(revenueChangePercentage.toFixed(1)),
        totalOrders,
        ordersChangePercentage: parseFloat(ordersChangePercentage.toFixed(1)),
        totalPayments,
        paymentsChangePercentage: parseFloat(paymentsChangePercentage.toFixed(1)),
        accountsReceivable: accountsReceivable._sum.balance || 0
      },
      charts: {
        revenueByMonth
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        spk: order.spk,
        customerName: order.customer?.nama || 'Unknown',
        date: order.created_at,
        amount: parseFloat(order.nominal_total || '0'),
        status: order.status
      }))
    });
  } catch (error) {
    console.error("Finance overview error:", error);
    return NextResponse.json({ 
      error: "Failed to aggregate finance overview", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}