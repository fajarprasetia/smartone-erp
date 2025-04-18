import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    
    console.log(`[API] Fetching paper GSMs with type filter: ${typeParam}`);
    
    // Create where clause for filtering
    const whereClause: any = {
      remainingLength: {
        gt: 0
      }
    };
    
    // Add type filter if specified
    if (typeParam === "DTF Film") {
      whereClause.type = "DTF Film";
      console.log("[API] Filtering for DTF Film papers only");
    } else if (typeParam === "regular") {
      whereClause.type = { 
        not: "DTF Film" 
      };
      console.log("[API] Filtering for regular papers (not DTF Film)");
    }
    
    // Fetch GSMs with their remaining lengths from paper_stocks table
    const paperStocks = await db.paperStock.groupBy({
      by: ['gsm'],
      where: whereClause,
      _sum: {
        remainingLength: true
      },
      orderBy: {
        gsm: 'asc'
      }
    });

    console.log(`[API] Found ${paperStocks.length} distinct GSM values`);
    
    // Format the results as objects with gsm and remainingLength properties
    const formattedResults = paperStocks.map(item => ({
      gsm: item.gsm,
      remainingLength: item._sum.remainingLength || 0
    }));
    
    console.log(`[API] Returning GSMs with remaining lengths: ${JSON.stringify(formattedResults)}`);
    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error in paper-stock/gsm endpoint:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch paper GSMs",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 