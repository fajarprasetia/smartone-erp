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

// GET: Fetch all fabric information for order form
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching fabrics information");
    
    try {
      // Fetch fabric information from the database
      const fabrics = await prisma.fabric.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          composition: true,
          weight: true,
          width: true,
          remaining_length: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      console.log(`[API] Found ${fabrics.length} fabrics`);
      
      // Map the data to the expected format
      const formattedFabrics = fabrics.map(fabric => ({
        id: fabric.id,
        name: fabric.name,
        description: fabric.description,
        composition: fabric.composition,
        weight: fabric.weight,
        width: fabric.width,
        remainingLength: fabric.remaining_length,
        length: fabric.remaining_length ? String(fabric.remaining_length) : undefined,
      }));
      
      return NextResponse.json(serializeData(formattedFabrics));
    } catch (dbError) {
      console.log("[API] Database error when fetching fabrics");
      console.error(dbError);
      
      // Return empty array to prevent frontend errors
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Error fetching fabrics:", error);
    
    // Return empty array as a last resort
    console.log("[API] Using empty array fallback for fabrics");
    return NextResponse.json([]);
  }
} 