import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

// Mock departments data
const departments = [
  { id: "1", name: "Marketing" },
  { id: "2", name: "Operations" },
  { id: "3", name: "Finance" },
  { id: "4", name: "Human Resources" },
  { id: "5", name: "Information Technology" },
  { id: "6", name: "Sales" },
  { id: "7", name: "Customer Service" },
  { id: "8", name: "Research & Development" }
];

// Mock data for budget testing
const mockBudgets = [
  {
    id: "1",
    name: "Marketing Budget 2024",
    year: 2024,
    description: "Annual marketing budget allocation",
    totalAmount: 120000000,
    department: {
      id: "1",
      name: "Marketing",
    },
    period: {
      id: "1",
      name: "Annual",
    },
    items: []
  },
  {
    id: "2",
    name: "Operations Budget Q2 2024",
    year: 2024,
    description: "Operations budget for Q2",
    totalAmount: 85000000,
    department: {
      id: "2",
      name: "Operations",
    },
    period: {
      id: "2",
      name: "Quarterly",
    },
    items: []
  }
];

// Mock budget performance data
const mockBudgetPerformance = [
  {
    year: 2024,
    accounts: [
      {
        accountId: "1",
        accountName: "Marketing Campaigns",
        accountNumber: "5001",
        budgetAmount: 50000000,
        actualAmount: 48000000,
        variance: 2000000,
        variancePercentage: 4
      },
      {
        accountId: "2",
        accountName: "Promotional Material",
        accountNumber: "5002",
        budgetAmount: 30000000,
        actualAmount: 32500000,
        variance: -2500000,
        variancePercentage: -8.33
      }
    ]
  }
];

// Get budgets with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const year = searchParams.get("year");
    const departmentId = searchParams.get("departmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // Return a specific budget if ID is provided
    if (id) {
      const budget = await db.budget.findUnique({
        where: { id },
        include: {
          department: true,
          period: true,
          items: {
            include: {
              account: true
            }
          }
        }
      });
      
      if (!budget) {
        return NextResponse.json({ error: "Budget not found" }, { status: 404 });
      }
      
      return NextResponse.json(budget);
    }
    
    // Build where condition based on filters
    const whereCondition: any = {};
    
    if (year) {
      whereCondition.year = parseInt(year);
    }
    
    if (departmentId) {
      whereCondition.departmentId = departmentId;
    }
    
    // Get total count for pagination
    const totalCount = await db.budget.count({
      where: whereCondition
    });
    
    // Get budgets with pagination
    const budgets = await db.budget.findMany({
      where: whereCondition,
      include: {
        department: true,
        period: true,
        items: {
          include: {
            account: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { name: 'asc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    
    // Get all years for filter dropdown
    const yearsData = await db.budget.findMany({
      select: {
        year: true
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc'
      }
    });
    
    const years = yearsData.map(y => y.year);
    
    // Get departments for filter dropdown
    const departments = await db.department.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Get budget vs actual data for performance metrics
    // This would normally involve complex queries joining budgets, transactions, etc.
    // For now, we'll generate some placeholder data based on real budgets
    
    // Group budgets by year for budget vs actual
    const budgetsByYear = await db.budget.findMany({
      where: year ? { year: parseInt(year) } : {},
      include: {
        items: {
          include: {
            account: true
          }
        }
      }
    });
    
    // Create budget vs actual data
    const budgetVsActual = [];
    
    // Group by year
    const yearGroups = new Map();
    budgetsByYear.forEach(budget => {
      if (!yearGroups.has(budget.year)) {
        yearGroups.set(budget.year, []);
      }
      yearGroups.get(budget.year).push(budget);
    });
    
    // For each year, aggregate budget items by account
    yearGroups.forEach((yearBudgets, year) => {
      const accountMap = new Map();
      
      // Collect budget amounts by account
      yearBudgets.forEach(budget => {
        budget.items.forEach(item => {
          const accountId = item.accountId;
          if (!accountMap.has(accountId)) {
            accountMap.set(accountId, {
              accountId,
              accountName: item.account.name,
              accountNumber: item.account.code,
              budgetAmount: 0,
              actualAmount: 0
            });
          }
          
          const account = accountMap.get(accountId);
          account.budgetAmount += Number(item.amount);
        });
      });
      
      // Generate random actual amounts (in a real app, this would come from transactions)
      accountMap.forEach(account => {
        // Random value between 80% and 120% of budget
        const randomFactor = 0.8 + (Math.random() * 0.4);
        account.actualAmount = Math.round(account.budgetAmount * randomFactor);
        
        // Calculate variance
        account.variance = account.budgetAmount - account.actualAmount;
        account.variancePercentage = account.budgetAmount > 0
          ? Math.round((account.variance / account.budgetAmount) * 100 * 100) / 100
          : 0;
      });
      
      budgetVsActual.push({
        year,
        accounts: Array.from(accountMap.values())
      });
    });
    
    // Return response with real data
    return NextResponse.json({
      budgets,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        pageCount: Math.ceil(totalCount / pageSize)
      },
      performance: budgetVsActual,
      budgetVsActual,
      filters: {
        departments,
        years
      }
    });
    
  } catch (error) {
    console.error("Error in budget API:", error);
    
    // If database tables don't exist yet, provide fallback data
    if (error.message?.includes('table') && error.message?.includes('not exist')) {
      // Fallback departments
      const fallbackDepartments = [
        { id: "1", name: "Marketing" },
        { id: "2", name: "Operations" },
        { id: "3", name: "Finance" }
      ];
      
      // Fallback budgets
      const fallbackBudgets = [
        {
          id: "1",
          name: "Marketing Budget 2024",
          year: 2024,
          description: "Annual marketing budget allocation",
          totalAmount: 120000000,
          department: {
            id: "1",
            name: "Marketing",
          },
          period: {
            id: "1",
            name: "Annual",
          },
          items: []
        },
        {
          id: "2",
          name: "Operations Budget Q2 2024",
          year: 2024,
          description: "Operations budget for Q2",
          totalAmount: 85000000,
          department: {
            id: "2",
            name: "Operations",
          },
          period: {
            id: "2",
            name: "Quarterly",
          },
          items: []
        }
      ];
      
      // Fallback budget performance
      const fallbackPerformance = [
        {
          year: 2024,
          accounts: [
            {
              accountId: "1",
              accountName: "Marketing Campaigns",
              accountNumber: "5001",
              budgetAmount: 50000000,
              actualAmount: 48000000,
              variance: 2000000,
              variancePercentage: 4
            },
            {
              accountId: "2",
              accountName: "Promotional Material",
              accountNumber: "5002",
              budgetAmount: 30000000,
              actualAmount: 32500000,
              variance: -2500000,
              variancePercentage: -8.33
            }
          ]
        }
      ];
      
      return NextResponse.json({
        budgets: fallbackBudgets,
        pagination: {
          total: fallbackBudgets.length,
          page: 1,
          pageSize: 10,
          pageCount: 1
        },
        performance: fallbackPerformance,
        budgetVsActual: fallbackPerformance,
        filters: {
          departments: fallbackDepartments,
          years: [2024, 2023]
        },
        fallback: true
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// Create a new budget
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.year) {
      return NextResponse.json(
        { error: "Name and year are required" },
        { status: 400 }
      );
    }

    // Create budget and budget items in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the budget
      const budget = await tx.budget.create({
        data: {
          name: data.name,
          year: data.year,
          description: data.description || null,
          departmentId: data.departmentId !== "NONE" ? data.departmentId : null,
          periodId: data.periodId || null,
          // Calculate total from items
          totalAmount: data.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0
        }
      });
      
      // Create budget items if any
      if (data.items && data.items.length > 0) {
        const validItems = data.items
          .filter(item => item.accountId && item.amount > 0)
          .map(item => ({
            budgetId: budget.id,
            accountId: item.accountId,
            description: item.description || null,
            amount: item.amount
          }));
          
        if (validItems.length > 0) {
          await tx.budgetItem.createMany({
            data: validItems
          });
        }
      }
      
      // Return the created budget with related data
      return tx.budget.findUnique({
        where: { id: budget.id },
        include: {
          department: true,
          period: true,
          items: {
            include: {
              account: true
            }
          }
        }
      });
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// Update an existing budget
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }
    
    // Check if budget exists
    const existingBudget = await db.budget.findUnique({
      where: { id }
    });
    
    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Update budget in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the budget
      const updatedBudget = await tx.budget.update({
        where: { id },
        data: {
          name: data.name || undefined,
          year: data.year || undefined,
          description: data.description || undefined,
          departmentId: data.departmentId === "NONE" ? null : data.departmentId || undefined,
          periodId: data.periodId || undefined,
          // If items are provided, recalculate total
          ...(data.items && {
            totalAmount: data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
          })
        }
      });
      
      // If items are provided, update them
      if (data.items) {
        // Delete existing items
        await tx.budgetItem.deleteMany({
          where: { budgetId: id }
        });
        
        // Create new items
        const validItems = data.items
          .filter(item => item.accountId && item.amount > 0)
          .map(item => ({
            budgetId: id,
            accountId: item.accountId,
            description: item.description || null,
            amount: item.amount
          }));
          
        if (validItems.length > 0) {
          await tx.budgetItem.createMany({
            data: validItems
          });
        }
      }
      
      // Return the updated budget
      return tx.budget.findUnique({
        where: { id },
        include: {
          department: true,
          period: true,
          items: {
            include: {
              account: true
            }
          }
        }
      });
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// Delete a budget
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }
    
    // Check if budget exists
    const existingBudget = await db.budget.findUnique({
      where: { id }
    });
    
    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    // Delete budget in transaction (delete items first due to foreign key)
    await db.$transaction([
      db.budgetItem.deleteMany({
        where: { budgetId: id }
      }),
      db.budget.delete({
        where: { id }
      })
    ]);
    
    return NextResponse.json({ 
      success: true, 
      message: "Budget deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}