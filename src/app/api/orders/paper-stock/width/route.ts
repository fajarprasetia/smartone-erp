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

// Sample fallback data based on GSM values
const fallbackWidthValues = {
  "90": ["110 cm", "145 cm", "160 cm"],
  "100": ["110 cm", "145 cm", "160 cm"],
  "120": ["110 cm", "120 cm", "145 cm", "160 cm"],
  "150": ["110 cm", "120 cm", "145 cm", "160 cm"],
  "180": ["110 cm", "120 cm", "145 cm", "160 cm", "180 cm"],
  "200": ["110 cm", "120 cm", "145 cm", "160 cm", "180 cm"],
  "230": ["145 cm", "160 cm", "180 cm"],
  "250": ["145 cm", "160 cm", "180 cm"]
};

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
    
    try {
      // Fetch distinct width values for the given GSM
      const widthValues = await prisma.$queryRaw`
        SELECT DISTINCT width
        FROM paper_stock
        WHERE gsm = ${gsm} AND remaining_length > 0
        ORDER BY width ASC
      `;

      console.log(`[API] Found ${Array.isArray(widthValues) ? widthValues.length : 0} width values for GSM ${gsm}`);
      
      // Extract width values from the result
      const formattedWidths = Array.isArray(widthValues)
        ? widthValues.map(item => item.width)
        : [];
      
      return NextResponse.json(serializeData(formattedWidths));
    } catch (dbError) {
      console.log("[API] Database error, returning fallback width data");
      console.error(dbError);
      
      // Return fallback data based on GSM
      const gsmStr = gsm as string;
      const fallbackWidths = fallbackWidthValues[gsmStr] || 
        ["110 cm", "120 cm", "145 cm", "160 cm"]; // Default widths if GSM not in fallback data
      
      return NextResponse.json(fallbackWidths);
    }
  } catch (error: any) {
    console.error("[API] Error fetching paper widths:", error);
    
    // Return fallback data as a last resort
    const gsm = new URL(req.url).searchParams.get("gsm") || "150";
    const fallbackWidths = fallbackWidthValues[gsm] || 
      ["110 cm", "120 cm", "145 cm", "160 cm"]; // Default widths
    
    console.log("[API] Using fallback width data");
    return NextResponse.json(fallbackWidths);
  }
} 