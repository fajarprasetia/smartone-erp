import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const availability = searchParams.get("availability");
    
    // Build query conditions
    const whereCondition: any = {};
    
    // Filter by availability if provided
    if (availability) {
      whereCondition.availability = availability;
    }
    
    // Get ink stocks
    const inkStocks = await db.inkStock.findMany({
      where: whereCondition,
      orderBy: {
        dateAdded: 'desc'
      },
      include: {
        takenByUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Transform data for response
    const transformedStocks = inkStocks.map(stock => ({
      id: stock.id,
      ink_type: stock.type,
      color: stock.color,
      quantity: stock.quantity.toString(),
      unit: stock.unit,
      manufacturer: stock.supplier,
      barcode_id: stock.barcode_id,
      qrcode: null, // If you implement QR code generation later
      availability: stock.availability,
      dateTaken: stock.dateTaken?.toISOString() || null,
      takenByUserId: stock.takenByUserId || null,
      taker_name: stock.takenByUser?.name || null,
      created_at: stock.dateAdded.toISOString()
    }));

    return NextResponse.json(transformedStocks);
  } catch (error) {
    console.error("Error fetching ink stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch ink stocks" },
      { status: 500 }
    );
  }
} 