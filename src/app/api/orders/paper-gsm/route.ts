import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET: Fetch all available paper GSM values
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching paper GSM values");
    
    try {
      // Fetch paper GSM values from the database
      const papers = await prisma.paperStock.findMany({
        where: {
          availability: "YES",
        },
        select: {
          id: true,
          gsm: true,
          width: true,
          remainingLength: true,
        },
        orderBy: {
          gsm: 'asc',
        },
      });

      console.log(`[API] Found ${papers.length} paper GSM values`);
      
      // Extract unique GSM values and sort them
      const uniqueGsm = [...new Set(papers.map(paper => paper.gsm))].sort((a, b) => a - b);
      
      return NextResponse.json(serializeData(uniqueGsm));
    } catch (dbError) {
      console.log("[API] Database error when fetching paper GSM values");
      console.error(dbError);
      
      // Return empty array to prevent frontend errors
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Error fetching paper GSM values:", error);
    
    // Return empty array as a last resort
    console.log("[API] Using empty array fallback for paper GSM values");
    return NextResponse.json([]);
  }
} 