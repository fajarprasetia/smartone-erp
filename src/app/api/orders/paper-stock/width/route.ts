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

// GET: Fetch paper widths for a specific GSM
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gsm = url.searchParams.get("gsm");
    
    if (!gsm) {
      return NextResponse.json(
        { error: "GSM parameter is required" },
        { status: 400 }
      );
    }
    
    console.log(`[API] Fetching paper widths for GSM: ${gsm}`);
    
    // Fetch distinct width values for the given GSM
    const widthValues = await prisma.$queryRaw`
      SELECT DISTINCT width
      FROM paper_stocks
      WHERE gsm = ${parseInt(gsm, 10)} AND remaining_length > 0
      ORDER BY width ASC
    `;

    console.log(`[API] Found ${Array.isArray(widthValues) ? widthValues.length : 0} width values for GSM ${gsm}`);
    
    // Extract width values from the result
    const formattedWidths = Array.isArray(widthValues)
      ? widthValues.map(item => item.width)
      : [];
    
    return NextResponse.json(serializeData(formattedWidths));
  } catch (error: any) {
    console.error("[API] Error fetching paper widths:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper widths", details: error.message },
      { status: 500 }
    );
  }
} 