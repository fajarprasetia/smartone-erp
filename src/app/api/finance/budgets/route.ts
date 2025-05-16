import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // Return a specific budget if ID is provided
    if (id) {
      const budget = mockBudgets.find(b => b.id === id);
      if (!budget) {
        return NextResponse.json({ error: "Budget not found" }, { status: 404 });
      }
      return NextResponse.json(budget);
    }
    
    // Filter budgets by year if provided
    let filteredBudgets = mockBudgets;
    if (year) {
      filteredBudgets = mockBudgets.filter(b => b.year === parseInt(year));
    }
    
    // Apply pagination
    const totalCount = filteredBudgets.length;
    const paginatedBudgets = filteredBudgets.slice((page - 1) * pageSize, page * pageSize);
    
    // Return with pagination info
    return NextResponse.json({
      budgets: paginatedBudgets,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        pageCount: Math.ceil(totalCount / pageSize)
      },
      performance: mockBudgetPerformance
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

    // Create new mock budget
    const newBudget = {
      id: (mockBudgets.length + 1).toString(),
      name: data.name,
      year: data.year,
      description: data.description || null,
      totalAmount: data.totalAmount || 0,
      department: data.departmentId ? { 
        id: data.departmentId,
        name: "Department " + data.departmentId
      } : null,
      period: data.periodId ? {
        id: data.periodId,
        name: "Period " + data.periodId
      } : null,
      items: []
    };

    // In a real application, you would save to database
    // Just return the mock data for now
    return NextResponse.json(newBudget, { status: 201 });
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
    
    // Find the budget to update
    const budgetIndex = mockBudgets.findIndex(b => b.id === id);
    if (budgetIndex === -1) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Create updated budget object
    const updatedBudget = {
      ...mockBudgets[budgetIndex],
      name: data.name || mockBudgets[budgetIndex].name,
      year: data.year || mockBudgets[budgetIndex].year,
      description: data.description || mockBudgets[budgetIndex].description,
      totalAmount: data.totalAmount || mockBudgets[budgetIndex].totalAmount
    };
    
    // In a real app, you would update the database
    // For now, just return the updated budget
    return NextResponse.json(updatedBudget);
    
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
    
    // Find the budget to delete
    const budgetIndex = mockBudgets.findIndex(b => b.id === id);
    if (budgetIndex === -1) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    
    // In a real app, you would delete from the database
    // For now, just return success
    return NextResponse.json({ success: true, message: "Budget deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}