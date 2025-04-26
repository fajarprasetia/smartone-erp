import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Get journal entry ID from query
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Journal entry ID is required" },
        { status: 400 }
      );
    }
    
    // Find the journal entry
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { 
        items: true,
        period: true
      },
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }
    
    // Check if entry can be posted
    if (existingEntry.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft journal entries can be posted" },
        { status: 400 }
      );
    }

    // Check if period is closed
    if (existingEntry.period.status === "CLOSED") {
      return NextResponse.json(
        { error: "Cannot post to a closed period" },
        { status: 400 }
      );
    }
    
    // Verify that the journal entry is balanced
    const totalDebit = existingEntry.items.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = existingEntry.items.reduce((sum, item) => sum + item.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: "Journal entry is not balanced. Debits must equal credits." },
        { status: 400 }
      );
    }
    
    // Update the journal entry
    const postedEntry = await db.journalEntry.update({
      where: { id },
      data: {
        status: "POSTED"
      },
      include: {
        items: true,
        period: true
      }
    });
    
    // Map the response
    const mappedEntry = {
      ...postedEntry,
      period: postedEntry.periodId,
      items: postedEntry.items.map((item) => ({
        id: item.id,
        journalEntryId: item.journalEntryId,
        accountId: item.accountId,
        description: item.description,
        debit: item.debit,
        credit: item.credit
      }))
    };
    
    return NextResponse.json({
      message: "Journal entry posted successfully",
      entry: mappedEntry
    });
  } catch (error) {
    console.error("Error posting journal entry:", error);
    return NextResponse.json(
      { error: "Failed to post journal entry" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate that a journalEntryId is provided
    if (!data.journalEntryId) {
      return NextResponse.json(
        { error: "Journal entry ID is required" },
        { status: 400 }
      );
    }
    
    // Find the journal entry
    const journalEntry = await db.journalEntry.findUnique({
      where: { id: data.journalEntryId },
      include: {
        items: true,
        period: true
      },
    });
    
    if (!journalEntry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }
    
    // Verify the entry's period is not closed
    if (journalEntry.period.status === "CLOSED") {
      return NextResponse.json(
        { error: "Cannot post entries in a closed period" },
        { status: 400 }
      );
    }
    
    // Verify that the entry is in DRAFT status
    if (journalEntry.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Journal entry is already in ${journalEntry.status} status` },
        { status: 400 }
      );
    }
    
    // Calculate debits and credits to ensure they balance
    const totalDebit = journalEntry.items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
    const totalCredit = journalEntry.items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
    
    // Check if debits and credits balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({
        error: "Debits must equal credits to post the entry",
        details: {
          totalDebits: totalDebit,
          totalCredits: totalCredit,
          difference: totalDebit - totalCredit
        }
      }, { status: 400 });
    }
    
    // Update journal entry status to POSTED
    const updatedEntry = await db.journalEntry.update({
      where: { id: data.journalEntryId },
      data: {
        status: "POSTED"
      },
      include: {
        items: true,
        period: true
      }
    });
    
    // Format the response
    const mappedEntry = {
      ...updatedEntry,
      period: updatedEntry.periodId,
      items: updatedEntry.items.map((item) => ({
        id: item.id,
        journalEntryId: item.journalEntryId,
        accountId: item.accountId,
        description: item.description,
        debit: item.debit,
        credit: item.credit
      }))
    };
    
    return NextResponse.json(mappedEntry);
  } catch (error) {
    console.error("Error posting journal entry:", error);
    return NextResponse.json(
      { error: "Failed to post journal entry", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 