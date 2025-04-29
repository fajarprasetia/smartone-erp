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
        type: true,
        gsm: true,
        width: true,
        length: true,
        remainingLength: true,
        manufacturer: true,
        availability: true,
        notes: true,
        dateAdded: true,
        dateUpdated: true
      },
      orderBy: [
        { gsm: 'asc' },
        { width: 'asc' }
      ]
    });

    // Map the response to include calculated fields
    const mappedStocks = paperStocks.map(stock => ({
      ...stock,
      manufacturer: stock.manufacturer || 'Unknown'
    }));

    return NextResponse.json(mappedStocks);
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