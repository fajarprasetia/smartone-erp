import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gsm = searchParams.get("gsm");
    const width = searchParams.get("width");

    if (!gsm || !width) {
      return NextResponse.json(
        { error: "GSM and width parameters are required" },
        { status: 400 }
      );
    }

    // Extract numeric values from parameters
    const gsmValue = parseInt(gsm.replace(/\s*GSM\s*$/i, ""));
    const widthValue = parseFloat(width);
    
    if (isNaN(gsmValue) || isNaN(widthValue)) {
      return NextResponse.json(
        { error: "Invalid GSM or width format" },
        { status: 400 }
      );
    }

    // Fetch paper stocks with the specified GSM and width
    const paperStocks = await db.paperStock.findMany({
      where: {
        gsm: gsmValue,
        width: widthValue,
        remainingLength: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        width: true,
        gsm: true,
        remainingLength: true,
        thickness: true,
        type: true,
        manufacturer: true,
        supplier: true,
        dateAdded: true,
        dateUpdated: true
      },
      orderBy: {
        dateAdded: 'desc'
      }
    });

    // Transform to match the expected format
    const formattedStocks = paperStocks.map(stock => ({
      id: stock.id,
      paper_code: stock.name,
      gsm: `${stock.gsm}`,
      width: `${stock.width}`,
      remaining_length: stock.remainingLength || 0,
      unit_price: 0, // Default price, replace with actual price field if available
      supplier: stock.supplier || '',
      created_at: stock.dateAdded.toISOString(),
      updated_at: stock.dateUpdated ? stock.dateUpdated.toISOString() : stock.dateAdded.toISOString()
    }));

    return NextResponse.json(formattedStocks);
  } catch (error) {
    console.error("Error in paper-stocks/details endpoint:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch paper stock details",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 