import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get total revenue from financial transactions
    const revenueTransactions = await prisma.financialTransaction.aggregate({
      where: {
        type: 'INCOME'
      },
      _sum: {
        amount: true
      }
    });

    // Get total orders count
    const totalOrders = await prisma.order.count();
    
    // Get orders from last month
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0); // Last day of previous month
    lastMonthEnd.setHours(23, 59, 59, 999);
    
    const lastMonthOrders = await prisma.order.count({
      where: {
        // Check if created_at exists, otherwise use tanggal
        OR: [
          {
            created_at: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          },
          {
            tanggal: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          }
        ]
      }
    });
    
    // Get orders from current month
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const currentMonthOrders = await prisma.order.count({
      where: {
        OR: [
          {
            created_at: {
              gte: currentMonthStart
            }
          },
          {
            tanggal: {
              gte: currentMonthStart
            }
          }
        ]
      }
    });
    
    // Get production data - current month items on production
    const currentMonthProduction = await prisma.order.count({
      where: {
        statusm: "ON PRODUCTION",
        OR: [
          {
            created_at: {
              gte: currentMonthStart
            }
          },
          {
            tanggal: {
              gte: currentMonthStart
            }
          }
        ]
      }
    });
    
    // Calculate order growth percentage
    const orderGrowthPercentage = lastMonthOrders > 0 
      ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;
    
    // Get production from last month with statusm "ON PRODUCTION"
    const lastMonthProduction = await prisma.order.count({
      where: {
        statusm: "ON PRODUCTION",
        OR: [
          {
            updated_at: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          },
          {
            tanggal: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          }
        ]
      }
    });
    
    // Calculate production growth percentage
    const productionGrowthPercentage = lastMonthProduction > 0 
      ? ((currentMonthProduction - lastMonthProduction) / lastMonthProduction) * 100 
      : 0;
    
    // Get active customers (with orders in the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const activeCustomersCount = await prisma.customer.count({
      where: {
        orders: {
          some: {
            OR: [
              {
                created_at: {
                  gte: sixMonthsAgo
                }
              },
              {
                tanggal: {
                  gte: sixMonthsAgo
                }
              }
            ]
          }
        }
      }
    });
    
    // Get active customers from previous month
    const activeCustomersLastMonth = await prisma.customer.count({
      where: {
        orders: {
          some: {
            OR: [
              {
                created_at: {
                  gte: lastMonthStart,
                  lte: lastMonthEnd
                }
              },
              {
                tanggal: {
                  gte: lastMonthStart,
                  lte: lastMonthEnd
                }
              }
            ]
          }
        }
      }
    });
    
    // Get active customers from current month
    const activeCustomersCurrentMonth = await prisma.customer.count({
      where: {
        orders: {
          some: {
            OR: [
              {
                created_at: {
                  gte: currentMonthStart
                }
              },
              {
                tanggal: {
                  gte: currentMonthStart
                }
              }
            ]
          }
        }
      }
    });
    
    // Calculate customer growth
    const customerGrowth = activeCustomersCurrentMonth - activeCustomersLastMonth;
    
    // Calculate current month revenue
    const currentMonthRevenue = await prisma.order.findMany({
      where: {
        OR: [
          {
            created_at: {
              gte: currentMonthStart
            }
          },
          {
            tanggal: {
              gte: currentMonthStart
            }
          }
        ]
      },
      select: {
        nominal: true
      }
    });
    
    // Calculate total revenue from current month orders
    const currentMonthTotal = currentMonthRevenue.reduce((sum, order) => {
      try {
        if (order.nominal) {
          return sum + parseFloat(order.nominal.replace(/[^0-9.-]+/g, ''));
        }
      } catch (e) {
        console.error(`Error parsing order amount:`, e);
      }
      return sum;
    }, 0);
    
    // Get data for the overview chart (revenue by month for last 12 months)
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyRevenue = [];
    
    // We need 12 months, so start from 11 months ago
    for (let i = 11; i >= 0; i--) {
      // Calculate the month that is i months before the current month
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth(); // 0-based month index
      
      // Calculate start and end dates for this month
      const startDate = new Date(year, month, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      console.log(`Month ${i} from now: ${startDate.toISOString().substring(0, 10)} to ${endDate.toISOString().substring(0, 10)}`);
      
      // Get orders for this month
      const monthOrders = await prisma.order.findMany({
        where: {
          OR: [
            {
              created_at: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              tanggal: {
                gte: startDate,
                lte: endDate
              }
            }
          ]
        },
        select: {
          nominal: true
        }
      });
      
      // Calculate total revenue from orders for this month
      const monthlyTotal = monthOrders.reduce((sum, order) => {
        try {
          if (order.nominal) {
            return sum + parseFloat(order.nominal.replace(/[^0-9.-]+/g, ''));
          }
        } catch (e) {
          console.error(`Error parsing order amount:`, e);
        }
        return sum;
      }, 0);
      
      // Add month data to array (month + 1 because getMonth is 0-indexed)
      monthlyRevenue.push({
        month: month + 1,
        year: year,
        revenue: monthlyTotal
      });
    }
    
    // Get recent sales data from orders and invoice data
    const recentSales = await prisma.order.findMany({
      take: 5,
      orderBy: [
        { created_at: 'desc' },
        { tanggal: 'desc' }
      ],
      include: {
        customer: true
      }
    });
    
    // Format recent sales for response
    const formattedRecentSales = recentSales.map(order => {
      // Try to parse nominal or use 0 if can't parse
      let amount = 0;
      try {
        if (order.nominal) {
          amount = parseFloat(order.nominal.replace(/[^0-9.-]+/g, ''));
        }
      } catch (e) {
        console.error(`Error parsing order amount for order ${order.id}:`, e);
      }
      
      return {
        id: order.id,
        customerName: order.customer?.nama || 'Unknown Customer',
        amount: amount,
        date: order.created_at || order.tanggal || new Date()
      };
    });
    
    // Calculate total revenue from orders if financial transactions is 0
    let totalRevenue = revenueTransactions._sum.amount || 0;
    if (totalRevenue === 0) {
      // Try to get revenue from orders
      const orders = await prisma.order.findMany({
        select: {
          nominal: true
        }
      });
      
      totalRevenue = orders.reduce((sum, order) => {
        try {
          if (order.nominal) {
            return sum + parseFloat(order.nominal.replace(/[^0-9.-]+/g, ''));
          }
        } catch (e) {
          console.error(`Error parsing order amount:`, e);
        }
        return sum;
      }, 0);
    }
    
    // Calculate revenue for last month
    const lastMonthRevenue = await prisma.order.findMany({
      where: {
        OR: [
          {
            created_at: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          },
          {
            tanggal: {
              gte: lastMonthStart,
              lte: lastMonthEnd
            }
          }
        ]
      },
      select: {
        nominal: true
      }
    });
    
    // Calculate total revenue from last month orders
    const lastMonthTotal = lastMonthRevenue.reduce((sum, order) => {
      try {
        if (order.nominal) {
          return sum + parseFloat(order.nominal.replace(/[^0-9.-]+/g, ''));
        }
      } catch (e) {
        console.error(`Error parsing order amount:`, e);
      }
      return sum;
    }, 0);
    
    // Calculate revenue growth percentage
    const revenueGrowthPercentage = lastMonthTotal > 0 
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;
    
    // Calculate customer growth percentage
    const customerGrowthPercentage = activeCustomersLastMonth > 0 
      ? ((activeCustomersCurrentMonth - activeCustomersLastMonth) / activeCustomersLastMonth) * 100 
      : 0;
    
    return NextResponse.json({
      revenue: {
        total: currentMonthTotal,
        growthPercentage: revenueGrowthPercentage
      },
      orders: {
        total: currentMonthOrders,
        growthPercentage: orderGrowthPercentage
      },
      production: {
        total: currentMonthProduction,
        growthPercentage: null // Remove growth percentage for production
      },
      customers: {
        active: activeCustomersCurrentMonth,
        growthPercentage: customerGrowthPercentage
      },
      overview: monthlyRevenue,
      recentSales: formattedRecentSales
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: String(error) },
      { status: 500 }
    );
  }
} 