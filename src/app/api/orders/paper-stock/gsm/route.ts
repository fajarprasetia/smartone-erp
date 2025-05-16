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

// Sample fallback data to use when the database table doesn't exist
const fallbackGsmValues = [
  { gsm: 90, remainingLength: 500 },
  { gsm: 100, remainingLength: 450 },
  { gsm: 120, remainingLength: 400 },
  { gsm: 150, remainingLength: 350 },
  { gsm: 180, remainingLength: 300 },
  { gsm: 200, remainingLength: 250 },
  { gsm: 230, remainingLength: 200 },
  { gsm: 250, remainingLength: 150 }
];

// GET: Fetch all distinct GSM values for paper stock
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching paper stock GSM values");
    
    try {
      // Fetch distinct GSM values with remaining length from the database
      // This assumes there's a paper_stock table with gsm and remaining_length columns
      const gsmValues = await prisma.$queryRaw`
        SELECT DISTINCT ON (gsm) gsm, SUM(remaining_length) as remaining_length
        FROM paper_stock
        WHERE remaining_length > 0
        GROUP BY gsm
        ORDER BY gsm ASC
      `;

      console.log(`[API] Found ${Array.isArray(gsmValues) ? gsmValues.length : 0} distinct GSM values`);
      
      // Format GSM values as numbers
      const formattedGsmValues = Array.isArray(gsmValues) 
        ? gsmValues.map(item => ({
            gsm: Number(item.gsm),
            remainingLength: Number(item.remaining_length)
          }))
        : [];
      
      return NextResponse.json(serializeData(formattedGsmValues));
    } catch (dbError) {
      console.log("[API] Database error, returning fallback GSM data");
      console.error(dbError);
      return NextResponse.json(fallbackGsmValues);
    }
  } catch (error: any) {
    console.error("[API] Error fetching paper stock GSM values:", error);
    
    // Return fallback data as a last resort
    console.log("[API] Using fallback GSM data");
    return NextResponse.json(fallbackGsmValues);
  }
} 