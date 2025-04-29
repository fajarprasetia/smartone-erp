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

// GET: Fetch all fabric names for the order form
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching fabric names");
    
    try {
      // Fetch fabric names from the database
      const fabrics = await prisma.inventory.findMany({
        select: {
          id: true,
          nama_bahan: true,
        },
        orderBy: {
          nama_bahan: 'asc',
        },
      });

      console.log(`[API] Found ${fabrics.length} fabric names`);
      
      // Map the data to the expected format
      const fabricNames = fabrics.map(fabric => ({
        id: fabric.id,
        name: fabric.nama_bahan,
      }));
      
      return NextResponse.json(serializeData(fabricNames));
    } catch (dbError) {
      console.log("[API] Database error when fetching fabric names");
      console.error(dbError);
      
      // Return empty array to prevent frontend errors
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Error fetching fabric names:", error);
    
    // Return empty array as a last resort
    console.log("[API] Using empty array fallback for fabric names");
    return NextResponse.json([]);
  }
} 