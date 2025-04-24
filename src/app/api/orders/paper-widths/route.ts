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

// GET: Fetch all available paper widths
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching paper widths");
    
    try {
      // Fetch paper widths from the database
      const papers = await prisma.paperStock.findMany({
        select: {
          id: true,
          width: true,
        },
        orderBy: {
          width: 'asc',
        },
        distinct: ['width'],
      });

      console.log(`[API] Found ${papers.length} paper widths`);
      
      // Extract and format the width values
      const paperWidths = papers.map((paper: { id: string; width: number }) => ({
        id: paper.id,
        width: paper.width,
      }));
      
      return NextResponse.json(serializeData(paperWidths));
    } catch (dbError) {
      console.log("[API] Database error when fetching paper widths");
      console.error(dbError);
      
      // Return empty array to prevent frontend errors
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Error fetching paper widths:", error);
    
    // Return empty array as a last resort
    console.log("[API] Using empty array fallback for paper widths");
    return NextResponse.json([]);
  }
} 