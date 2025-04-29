import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

// Get budgets with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const year = searchParams.get("year");
    const departmentId = searchParams.get("departmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Build where clause
    const where: any = {};
    if (year) where.year = parseInt(year);
    if (departmentId) where.departmentId = departmentId;

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

    // Get budgets with pagination
    const [budgets, totalCount] = await Promise.all([
      db.budget.findMany({
        where,
        include: {
          department: true,
          period: true,
          items: {
            include: {
              account: true
            }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          year: 'desc'
        }
      }),
      db.budget.count({ where })
    ]);

    // Get budget performance data
    const query = `
      SELECT 
        b.year,
        a.id as "accountId",
        a.name as "accountName",
        a.code as "accountNumber",
        COALESCE(SUM(bi.amount), 0) as "budgetAmount",
        COALESCE(SUM(t.amount), 0) as "actualAmount",
        COALESCE(SUM(t.amount), 0) - COALESCE(SUM(bi.amount), 0) as "variance",
        CASE 
          WHEN COALESCE(SUM(bi.amount), 0) = 0 THEN 0
          ELSE ((COALESCE(SUM(t.amount), 0) - COALESCE(SUM(bi.amount), 0)) / COALESCE(SUM(bi.amount), 0)) * 100
        END as "variancePercentage"
      FROM "Budget" b
      LEFT JOIN "BudgetItem" bi ON b.id = bi."budgetId"
      LEFT JOIN "Account" a ON bi."accountId" = a.id
      LEFT JOIN "FinancialTransaction" t ON a.id = t."accountId"
      ${year ? 'WHERE b.year = $1' : ''}
      GROUP BY b.year, a.id, a.name, a.code
      ORDER BY b.year DESC, a.code ASC
    `;

    const budgetPerformance = year 
      ? await db.$queryRawUnsafe(query, parseInt(year))
      : await db.$queryRawUnsafe(query);

    // Get available filters
    const [years, departments] = await Promise.all([
      db.budget.findMany({
        select: {
          year: true
        },
        distinct: ['year'],
        orderBy: {
          year: 'desc'
        }
      }),
      db.department.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    return NextResponse.json({
      budgets,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        pageCount: Math.ceil(totalCount / pageSize)
      },
      budgetVsActual: budgetPerformance,
      filters: {
        years: years.map(y => y.year),
        departments
      }
    });

  } catch (error) {
    console.error("Error in budget API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Validate budget items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: "At least one budget item is required" },
        { status: 400 }
      );
    }

    // Create budget with items in a transaction
    const budget = await db.$transaction(async (tx) => {
      // Create the budget
      const newBudget = await tx.budget.create({
        data: {
          name: data.name,
          year: data.year,
          description: data.description,
          departmentId: data.departmentId || null,
          periodId: data.periodId || null,
          totalAmount: data.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
        }
      });

      // Create budget items
      await tx.budgetItem.createMany({
        data: data.items.map((item: any) => ({
          budgetId: newBudget.id,
          accountId: item.accountId,
          description: item.description,
          amount: item.amount
        }))
      });

      // Return the complete budget with items
      return tx.budget.findUnique({
        where: { id: newBudget.id },
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

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    
    const data = await request.json();
    
    // Update budget with items in a transaction
    const budget = await db.$transaction(async (tx) => {
      // Update the budget
      const updatedBudget = await tx.budget.update({
        where: { id },
        data: {
          name: data.name,
          year: data.year,
          description: data.description,
          departmentId: data.departmentId || null,
          periodId: data.periodId || null,
          totalAmount: data.items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
        }
      });

      // If items are provided, update them
      if (data.items) {
        // Delete existing items
        await tx.budgetItem.deleteMany({
          where: { budgetId: id }
        });

        // Create new items
        await tx.budgetItem.createMany({
          data: data.items.map((item: any) => ({
            budgetId: id,
            accountId: item.accountId,
            description: item.description,
            amount: item.amount
          }))
        });
      }

      // Return the complete budget with items
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

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    
    // Delete budget and all related items (cascade delete will handle items)
    const deletedBudget = await db.budget.delete({
      where: { id }
    });

    if (!deletedBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Budget deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}