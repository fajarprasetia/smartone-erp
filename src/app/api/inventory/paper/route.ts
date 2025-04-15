import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch all paper stocks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const availability = searchParams.get('availability');
    const paperType = searchParams.get('type');
    const gsm = searchParams.get('gsm');
    const width = searchParams.get('width');
    const approvedParam = searchParams.get('approved');
    const remainingLengthParam = searchParams.get('remainingLength');
    const includeUsers = searchParams.get('include_users') === 'true';
    
    // Build the where clause based on provided filters
    const whereClause: any = {};
    
    if (availability) {
      whereClause.availability = availability;
    }
    
    if (paperType) {
      whereClause.type = paperType;
    }
    
    if (gsm) {
      whereClause.gsm = parseInt(gsm);
    }
    
    if (width) {
      whereClause.width = parseFloat(width);
    }
    
    if (approvedParam) {
      whereClause.approved = approvedParam === 'true';
    }
    
    console.log("Filter query:", JSON.stringify(whereClause, null, 2));
    
    // Execute the query with the basic filters
    let paperStocks = await prisma.paperStock.findMany({
      where: whereClause,
      orderBy: {
        dateAdded: 'desc',
      },
      include: {
        // Include related user data
        addedByUser: {
          select: {
            id: true,
            name: true
          }
        },
        takenByUser: includeUsers ? {
          select: {
            id: true,
            name: true
          }
        } : false,
        paperLogs: {
          take: 5,
          orderBy: {
            created_at: 'desc'
          },
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    // Post-process the results for remaining length if needed
    if (remainingLengthParam === 'available') {
      paperStocks = paperStocks.filter(stock => {
        return stock.remainingLength !== null && stock.remainingLength > 0;
      });
    }

    // Transform the results to match the expected format in the frontend
    const transformedStocks = paperStocks.map(stock => ({
      ...stock,
      paper_type: stock.type,
      user_name: stock.addedByUser?.name || null,
      taker_name: stock.takenByUser?.name || null,
      remaining_length: stock.remainingLength,
      created_at: stock.dateAdded,
      logs: stock.paperLogs
    }));

    return NextResponse.json(transformedStocks);
  } catch (error) {
    console.error("Error fetching paper stocks:", error);
    return NextResponse.json(
      { error: "Error fetching paper stocks", details: error instanceof Error ? error.message : String(error) },
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