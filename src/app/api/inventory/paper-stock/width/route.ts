import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gsmParam = searchParams.get("gsm");

    if (!gsmParam) {
      return NextResponse.json(
        { error: "GSM parameter is required" },
        { status: 400 }
      );
    }

    // Parse GSM to integer
    const gsm = parseInt(gsmParam, 10);
    if (isNaN(gsm)) {
      return NextResponse.json(
        { error: "GSM must be a valid number" },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching paper widths for GSM: ${gsm}`);

    // Fetch paper widths with the numeric GSM value
    const paperStocks = await db.paperStock.findMany({
      where: {
        gsm: gsm,
        remainingLength: {
          gt: 0
        }
      },
      select: {
        width: true,
        remainingLength: true
      },
      orderBy: {
        width: 'asc'
      }
    });

    console.log(`[API] Found ${paperStocks.length} paper stocks with GSM ${gsm}`);

    // Group widths and sum remaining length
    const widthMap = new Map();
    
    paperStocks.forEach(stock => {
      if (stock.width === null || stock.width === undefined) return;
      
      const width = stock.width.toString();
      const currentTotal = widthMap.get(width) || 0;
      widthMap.set(width, currentTotal + (stock.remainingLength || 0));
    });
    
    // Convert map to array of objects with width and remainingLength
    const widthOptions = Array.from(widthMap.entries())
      .filter(([_, remainingLength]) => remainingLength > 0)
      .map(([width, remainingLength]) => ({
        width,
        remainingLength
      }))
      .sort((a, b) => parseFloat(a.width) - parseFloat(b.width));

    console.log(`[API] Returning width options: ${JSON.stringify(widthOptions)}`);
    return NextResponse.json(widthOptions);
  } catch (error: any) {
    console.error("Error fetching paper widths:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch paper widths",
        message: error.message,
        details: String(error)
      },
      { status: 500 }
    );
  }
} 