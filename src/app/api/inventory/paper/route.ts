import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch paper stock data
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const availability = url.searchParams.get("availability");
    
    // Build query
    const whereClause = {};
    if (availability === "YES") {
      whereClause["availability"] = "YES";
    }

    // Fetch paper stocks
    try {
      const paperStocks = await prisma.paperStock.findMany({
        where: whereClause,
        orderBy: [
          { gsm: 'asc' },
          { width: 'asc' }
        ]
      });

      return NextResponse.json(paperStocks);
    } catch (error) {
      console.error("Database error fetching paper stocks:", error);
      
      // Fallback to hardcoded data for testing
      if (process.env.NODE_ENV === "development") {
        const fallbackData = [
          { id: "1", gsm: "70", width: "100", remaining_length: "50", availability: "YES", paper_type: "Sublimation" },
          { id: "2", gsm: "80", width: "120", remaining_length: "75", availability: "YES", paper_type: "Sublimation" },
          { id: "3", gsm: "100", width: "150", remaining_length: "100", availability: "YES", paper_type: "Sublimation" },
          { id: "4", gsm: "120", width: "160", remaining_length: "80", availability: "YES", paper_type: "Inkjet" },
          { id: "5", gsm: "150", width: "180", remaining_length: "60", availability: "YES", paper_type: "Inkjet" }
        ];
        return NextResponse.json(fallbackData);
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error fetching paper stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper stocks" },
      { status: 500 }
    );
  }
}

// POST: Add a new paper stock
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Validate that the user ID exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userExists) {
      console.error(`User with ID ${userId} not found in database`);
      return NextResponse.json(
        { error: "Invalid user", details: "User ID not found in database. Your session may be invalid." },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    
    // Log the incoming data
    console.log("Creating paper stock with data:", data);
    console.log("Current user ID:", userId);
    
    // Validate required fields
    if (!data.gsm || !data.width || !data.length) {
      return NextResponse.json(
        { error: "Missing required fields", details: "GSM, width, and length are required" },
        { status: 400 }
      );
    }
    
    // Create with a structure that exactly matches the Prisma model
    const newPaperStock = await prisma.paperStock.create({
      data: {
        name: data.name || `${data.paper_type || "Paper"} ${data.gsm}gsm ${data.width}x${data.length}cm`,
        type: data.paper_type || "Sublimation Paper",
        manufacturer: data.manufacturer || data.supplier || null,
        width: parseFloat(data.width),
        height: parseFloat(data.height || data.width),
        length: parseFloat(data.length),
        gsm: parseInt(data.gsm),
        thickness: data.thickness ? parseFloat(data.thickness) : null,
        remainingLength: data.remaining_length ? parseFloat(data.remaining_length) : parseFloat(data.length),
        addedByUserId: userId,
        notes: data.notes || null,
        qrCode: data.barcode_id || null,
        availability: "YES",
        approved: false,
      },
    });

    // Create a log entry for the new paper stock
    await prisma.paperLog.create({
      data: {
        action: "ADDED",
        performed_by: userId,
        notes: data.from_request
          ? `Added from approved request: ${data.gsm} GSM, ${data.width}x${data.length}cm`
          : `Added new paper stock: ${data.gsm} GSM, ${data.width}x${data.length}cm`,
        paper_stock_id: newPaperStock.id,
      },
    });

    return NextResponse.json(newPaperStock, { status: 201 });
  } catch (error) {
    console.error("Error adding paper stock:", error);
    return NextResponse.json(
      { error: "Error adding paper stock", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}