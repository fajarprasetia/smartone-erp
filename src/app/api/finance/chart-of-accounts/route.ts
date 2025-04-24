import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get chart of accounts with optional pagination and filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const sortBy = searchParams.get("sortBy") || "code";
    const sortDirection = searchParams.get("sortDirection") || "asc";
    
    // Return a specific account if ID is provided
    if (id) {
      const account = await db.chartOfAccount.findUnique({
        where: { id }
      });
      
      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      
      return NextResponse.json(account);
    }
    
    // Build filter for accounts list
    const filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (search) {
      filter.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { subtype: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const totalCount = await db.chartOfAccount.count({
      where: filter
    });
    
    // Get accounts with pagination
    const accounts = await db.chartOfAccount.findMany({
      where: filter,
      orderBy: {
        [sortBy]: sortDirection
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    
    // Get unique account types for filtering
    const accountTypes = await db.chartOfAccount.findMany({
      distinct: ['type'],
      select: { type: true }
    });
    
    return NextResponse.json({
      accounts,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize
      },
      filters: {
        types: accountTypes.map(item => item.type)
      }
    });
    
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return NextResponse.json({ 
      error: "Failed to fetch chart of accounts", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Create a new account
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.code || !data.name || !data.type) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        required: ["code", "name", "type"]
      }, { status: 400 });
    }
    
    // Check for duplicate account code
    const existingAccount = await db.chartOfAccount.findFirst({
      where: { code: data.code }
    });
    
    if (existingAccount) {
      return NextResponse.json({ 
        error: "Account code already exists" 
      }, { status: 400 });
    }
    
    // Create the new account
    const newAccount = await db.chartOfAccount.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        subtype: data.subtype || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        balance: data.balance || 0
      }
    });
    
    return NextResponse.json(newAccount, { status: 201 });
    
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ 
      error: "Failed to create account", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Update an existing account
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }
    
    const data = await req.json();
    
    // Check if account exists
    const existingAccount = await db.chartOfAccount.findUnique({
      where: { id }
    });
    
    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    
    // If code is being changed, check for duplicates
    if (data.code && data.code !== existingAccount.code) {
      const duplicateAccount = await db.chartOfAccount.findFirst({
        where: { 
          code: data.code,
          id: { not: id }
        }
      });
      
      if (duplicateAccount) {
        return NextResponse.json({ 
          error: "Account code already exists" 
        }, { status: 400 });
      }
    }
    
    // Update the account
    const updatedAccount = await db.chartOfAccount.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code : existingAccount.code,
        name: data.name !== undefined ? data.name : existingAccount.name,
        type: data.type !== undefined ? data.type : existingAccount.type,
        subtype: data.subtype !== undefined ? data.subtype : existingAccount.subtype,
        description: data.description !== undefined ? data.description : existingAccount.description,
        isActive: data.isActive !== undefined ? data.isActive : existingAccount.isActive,
        balance: data.balance !== undefined ? data.balance : existingAccount.balance
      }
    });
    
    return NextResponse.json(updatedAccount);
    
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ 
      error: "Failed to update account", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Delete an account
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }
    
    // Check if account exists
    const existingAccount = await db.chartOfAccount.findUnique({
      where: { id }
    });
    
    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    
    // Check if account is in use
    const journalItems = await db.journalEntryItem.findFirst({
      where: { accountId: id }
    });
    
    if (journalItems) {
      return NextResponse.json({ 
        error: "Cannot delete account because it is in use in journal entries" 
      }, { status: 400 });
    }
    
    // Delete the account
    await db.chartOfAccount.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ 
      error: "Failed to delete account", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 