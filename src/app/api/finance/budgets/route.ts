import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get budgets with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const year = searchParams.get("year");
    const periodId = searchParams.get("periodId");
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
    
    // Build filter for budget list
    const filter: any = {};
    
    if (year) {
      filter.year = parseInt(year);
    }
    
    if (periodId) {
      filter.periodId = periodId;
    }
    
    if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    // Get total count for pagination
    const totalCount = await db.budget.count({
      where: filter
    });
    
    // Get budgets with pagination
    const budgets = await db.budget.findMany({
      where: filter,
      include: {
        department: true,
        period: true,
        items: {
          include: {
            account: true
          }
        }
      },
      orderBy: { year: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    
    // Calculate budget vs actual if we have budgets
    let budgetVsActual = [];
    
    if (budgets.length > 0) {
      // Get unique years from budgets
      const years = [...new Set(budgets.map(budget => budget.year))];
      
      // For each year, calculate budget vs actual
      budgetVsActual = await Promise.all(years.map(async (year) => {
        // Get all budget items for this year
        const yearBudgets = budgets.filter(b => b.year === year);
        const budgetItems = yearBudgets.flatMap(b => b.items);
        
        // Group budget items by account
        const accountMap = new Map();
        
        budgetItems.forEach(item => {
          if (!accountMap.has(item.accountId)) {
            accountMap.set(item.accountId, {
              accountId: item.accountId,
              accountName: item.account.name,
              accountNumber: item.account.accountNumber,
              budgetAmount: 0,
              actualAmount: 0,
              variance: 0,
              variancePercentage: 0
            });
          }
          
          const account = accountMap.get(item.accountId);
          account.budgetAmount += item.amount;
        });
        
        // Get all journal entries for this year
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);
        
        const journalItems = await db.journalEntryItem.findMany({
          where: {
            journalEntry: {
              date: {
                gte: startDate,
                lte: endDate
              },
              status: "POSTED"
            }
          },
          include: {
            account: true
          }
        });
        
        // Calculate actual amounts from journal entries
        journalItems.forEach(item => {
          if (accountMap.has(item.accountId)) {
            const account = accountMap.get(item.accountId);
            // For expense and asset accounts, debits increase the account
            // For income, liability, and equity accounts, credits increase the account
            if (['EXPENSE', 'ASSET'].includes(item.account.type)) {
              account.actualAmount += item.debit - item.credit;
            } else {
              account.actualAmount += item.credit - item.debit;
            }
          }
        });
        
        // Calculate variance for each account
        accountMap.forEach(account => {
          account.variance = account.budgetAmount - account.actualAmount;
          account.variancePercentage = account.budgetAmount !== 0 ? 
            Math.round((account.variance / account.budgetAmount) * 100) : 0;
        });
        
        return {
          year,
          accounts: Array.from(accountMap.values())
        };
      }));
    }
    
    // Get departments for filtering
    const departments = await db.department.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Get available years for filtering
    const availableYears = await db.budget.findMany({
      distinct: ['year'],
      orderBy: { year: 'desc' },
      select: { year: true }
    });
    
    return NextResponse.json({
      budgets,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize
      },
      budgetVsActual,
      filters: {
        departments,
        years: availableYears.map(y => y.year)
      }
    });
    
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ 
      error: "Failed to fetch budgets", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Create a new budget
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      name,
      year,
      description,
      periodId,
      departmentId,
      items = []
    } = data;
    
    // Validate required fields
    if (!name || !year || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if a budget already exists for this department and period
    if (periodId && departmentId) {
      const existingBudget = await db.budget.findFirst({
        where: {
          periodId,
          departmentId
        }
      });
      
      if (existingBudget) {
        return NextResponse.json({ 
          error: "A budget already exists for this department and period",
          existingBudget
        }, { status: 400 });
      }
    }
    
    // Calculate total budget amount
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Create the budget with its items in a transaction
    return await db.$transaction(async (tx) => {
      const budget = await tx.budget.create({
        data: {
          name,
          year: parseInt(year),
          description,
          periodId,
          departmentId,
          totalAmount
        }
      });
      
      // Create budget items
      for (const item of items) {
        await tx.budgetItem.create({
          data: {
            budgetId: budget.id,
            accountId: item.accountId,
            description: item.description,
            amount: parseFloat(item.amount)
          }
        });
      }
      
      // Return the created budget with items
      const createdBudget = await tx.budget.findUnique({
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
      
      return NextResponse.json({
        success: true,
        budget: createdBudget
      });
    });
    
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ 
      error: "Failed to create budget", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Update an existing budget
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const {
      id,
      name,
      description,
      items = []
    } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }
    
    const budget = await db.budget.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    // Calculate new total amount
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Update budget and its items in a transaction
    return await db.$transaction(async (tx) => {
      // Update the budget
      await tx.budget.update({
        where: { id },
        data: {
          name: name || budget.name,
          description: description !== undefined ? description : budget.description,
          totalAmount
        }
      });
      
      // Delete existing budget items
      await tx.budgetItem.deleteMany({
        where: { budgetId: id }
      });
      
      // Create new budget items
      for (const item of items) {
        await tx.budgetItem.create({
          data: {
            budgetId: id,
            accountId: item.accountId,
            description: item.description,
            amount: parseFloat(item.amount)
          }
        });
      }
      
      // Return the updated budget with items
      const updatedBudget = await tx.budget.findUnique({
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
      
      return NextResponse.json({
        success: true,
        budget: updatedBudget
      });
    });
    
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json({ 
      error: "Failed to update budget", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Delete a budget
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }
    
    const budget = await db.budget.findUnique({
      where: { id }
    });
    
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    // Delete budget and its items in a transaction
    return await db.$transaction(async (tx) => {
      // Delete budget items first (due to foreign key constraint)
      await tx.budgetItem.deleteMany({
        where: { budgetId: id }
      });
      
      // Delete the budget
      await tx.budget.delete({
        where: { id }
      });
      
      return NextResponse.json({
        success: true,
        message: "Budget deleted successfully"
      });
    });
    
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json({ 
      error: "Failed to delete budget", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}