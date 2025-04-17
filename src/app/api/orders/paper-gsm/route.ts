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
      const papers = await prisma.paper.findMany({
        select: {
          id: true,
          gsm: true,
        },
        orderBy: {
          gsm: 'asc',
        },
        distinct: ['gsm'],
      });

      console.log(`[API] Found ${papers.length} paper GSM values`);
      
      // Extract and format the GSM values
      const paperGsm = papers.map(paper => ({
        id: paper.id,
        gsm: paper.gsm,
      }));
      
      return NextResponse.json(serializeData(paperGsm));
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