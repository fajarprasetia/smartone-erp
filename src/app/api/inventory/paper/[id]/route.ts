import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch a specific paper stock by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const paperStock = await prisma.paperStock.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!paperStock) {
      return NextResponse.json(
        { error: "Paper stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(paperStock);
  } catch (error) {
    console.error("Error fetching paper stock:", error);
    return NextResponse.json(
      { error: "Error fetching paper stock", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT: Update a specific paper stock by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();
    
    // Log the incoming data
    console.log("Updating paper stock with data:", data);
    
    // Validate required fields
    if (!data.gsm || !data.width || !data.length || !data.remaining_length) {
      return NextResponse.json(
        { error: "Missing required fields", details: "GSM, width, length, and remaining length are required" },
        { status: 400 }
      );
    }
    
    // Check if paper stock exists
    const existingStock = await prisma.paperStock.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: "Paper stock not found" },
        { status: 404 }
      );
    }
    
    // Update the paper stock
    const updatedPaperStock = await prisma.paperStock.update({
      where: {
        id: params.id,
      },
      data: {
        barcode_id: data.barcode_id || null,
        supplier: data.supplier || null,
        paperType: data.paper_type || "Sublimation Paper",
        gsm: data.gsm,
        width: data.width,
        length: data.length,
        remaining_length: data.remaining_length,
        notes: data.notes || null,
        updated_by: userId,
        updated_at: new Date(),
      },
    });

    // Create a log entry for the updated paper stock
    await prisma.paperLog.create({
      data: {
        action: "UPDATED",
        performed_by: userId,
        notes: `Updated paper stock: ${data.gsm} GSM, ${data.width}x${data.length}cm`,
        paper_stock_id: updatedPaperStock.id,
      },
    });

    return NextResponse.json(updatedPaperStock);
  } catch (error) {
    console.error("Error updating paper stock:", error);
    return NextResponse.json(
      { error: "Error updating paper stock", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific paper stock by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Check if paper stock exists
    const existingStock = await prisma.paperStock.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: "Paper stock not found" },
        { status: 404 }
      );
    }
    
    // Create a log entry before deleting the paper stock
    await prisma.paperLog.create({
      data: {
        action: "DELETED",
        performed_by: userId,
        notes: `Deleted paper stock: ${existingStock.gsm} GSM, ${existingStock.width}x${existingStock.length}cm`,
        // Don't link to paper stock since it's going to be deleted
      },
    });
    
    // Delete the paper stock
    await prisma.paperStock.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { message: "Paper stock deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting paper stock:", error);
    return NextResponse.json(
      { error: "Error deleting paper stock", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 