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
    if (existingEntry.period.isClosed) {
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
    
    // Post the journal entry
    const postedEntry = await db.journalEntry.update({
      where: { id },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        postedById: session.userId
      },
      include: {
        items: true
      }
    });
    
    // Update account balances (this could be done in a transaction but kept simple for this example)
    // In a real application, you might use a more sophisticated ledger system
    
    return NextResponse.json({
      message: "Journal entry posted successfully",
      entry: postedEntry
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
        status: "POSTED",
        postedAt: new Date(),
        postedById: session.userId,
      },
      include: {
        items: {
          include: { 
            account: true 
          }
        },
        period: true,
      },
    });
    
    // Format the response
    const formattedEntry = {
      id: updatedEntry.id,
      entryNumber: updatedEntry.entryNumber,
      date: updatedEntry.date.toISOString(),
      periodId: updatedEntry.periodId,
      periodName: updatedEntry.period.name,
      description: updatedEntry.description,
      reference: updatedEntry.reference,
      status: updatedEntry.status,
      postedAt: updatedEntry.postedAt?.toISOString(),
      items: updatedEntry.items.map(item => ({
        id: item.id,
        journalEntryId: item.journalEntryId,
        accountId: item.accountId,
        accountCode: item.account.code,
        accountName: item.account.name,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
      })),
    };
    
    return NextResponse.json(formattedEntry);
  } catch (error) {
    console.error("Error posting journal entry:", error);
    return NextResponse.json(
      { error: "Failed to post journal entry", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 