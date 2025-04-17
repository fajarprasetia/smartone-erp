import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch paper GSMs using Prisma
    const paperStocks = await db.paperStock.groupBy({
      by: ['gsm'],
      where: {
        remaining_length: {
          gt: 0
        },
        gsm: {
          not: '',
          not: null
        }
      },
      _sum: {
        remaining_length: true
      },
      orderBy: {
        gsm: 'asc'
      },
      having: {
        remaining_length: {
          _sum: {
            gt: 0
          }
        }
      }
    });

    // Handle empty results
    if (!paperStocks || paperStocks.length === 0) {
      return NextResponse.json([]);
    }

    // Map and validate results
    const formattedResults = paperStocks
      .map(stock => ({
        gsm: stock.gsm,
        remainingLength: stock._sum.remaining_length || 0
      }))
      .filter(item => item.gsm && item.remainingLength > 0);

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error in paper-stocks/gsm endpoint:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch paper GSMs",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 