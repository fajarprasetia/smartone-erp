import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    
    // Fetch departments from database
    const departments = await db.department.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Fetch chart of accounts
    let accountsQuery = {};
    
    // Filter by department if provided
    if (departmentId) {
      accountsQuery = {
        where: {
          departmentId: departmentId
        }
      };
    }
    
    const accounts = await db.account.findMany({
      ...accountsQuery,
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { code: 'asc' }
      ]
    });
    
    // Format the response
    const formattedAccounts = accounts.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      departmentId: account.department?.id,
      departmentName: account.department?.name
    }));
    
    return NextResponse.json({
      departments,
      accounts: formattedAccounts,
      success: true
    });
    
  } catch (error) {
    console.error("Error fetching accounts:", error);
    
    // If database tables don't exist yet, provide fallback data
    if (error.message?.includes('table') && error.message?.includes('not exist')) {
      // Fallback departments
      const fallbackDepartments = [
        { id: "1", name: "Marketing" },
        { id: "2", name: "Operations" },
        { id: "3", name: "Finance" },
        { id: "4", name: "Human Resources" },
        { id: "5", name: "Information Technology" }
      ];
      
      // Fallback accounts
      const fallbackAccounts = [
        { id: "1", code: "5001", name: "Marketing Campaigns", type: "Expense" },
        { id: "2", code: "5002", name: "Promotional Material", type: "Expense" },
        { id: "3", code: "5003", name: "Advertising", type: "Expense" },
        { id: "4", code: "5101", name: "Operations Equipment", type: "Expense" },
        { id: "5", code: "5102", name: "Warehouse Expenses", type: "Expense" }
      ];
      
      return NextResponse.json({
        departments: fallbackDepartments,
        accounts: fallbackAccounts,
        success: true,
        fallback: true
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
} 