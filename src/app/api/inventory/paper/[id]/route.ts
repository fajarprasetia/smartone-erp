import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a specific paper stock by ID
export async function GET(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    const paper = await prisma.paperStock.findUnique({
      where: { id }
    });

    if (!paper) {
      return new NextResponse(
        JSON.stringify({ error: "Paper stock not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("Error fetching paper stock:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch paper stock" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT: Update a specific paper stock by ID
export async function PUT(req: Request, { params }: any) {
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
        qrCode: data.barcode_id || null,
        manufacturer: data.supplier || null,
        type: data.paper_type || "Sublimation Paper",
        gsm: data.gsm,
        width: data.width,
        length: data.length,
        remainingLength: data.remaining_length,
        notes: data.notes || null,
        updatedByUserId: userId,
        dateUpdated: new Date(),
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
export async function DELETE(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    await prisma.paperStock.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting paper stock:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete paper stock" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    const body = await req.json();

    const updatedPaper = await prisma.paperStock.update({
      where: { id },
      data: body
    });

    return NextResponse.json(updatedPaper);
  } catch (error) {
    console.error("Error updating paper stock:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update paper stock" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 