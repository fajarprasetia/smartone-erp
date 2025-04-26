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
      const fabrics = await prisma.inventory.findMany({
        select: {
          id: true,
          nama_bahan: true, 
          asal_bahan: true,
          lebar_bahan: true,
          berat_bahan: true,
          est_pjg_bahan: true,
          roll: true,
          keterangan: true,
          tanggal: true,
        },
        orderBy: {
          nama_bahan: 'asc',
        },
      });

      console.log(`[API] Found ${fabrics.length} fabrics`);
      
      // Map the data to the expected format
      const formattedFabrics = fabrics.map(fabric => ({
        id: fabric.id,
        name: fabric.nama_bahan,
        description: fabric.keterangan,
        composition: null, // Not available in the model
        weight: fabric.berat_bahan,
        width: fabric.lebar_bahan,
        remainingLength: fabric.est_pjg_bahan,
        length: fabric.est_pjg_bahan,
        roll: fabric.roll,
        date: fabric.tanggal,
        sourceId: fabric.asal_bahan
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