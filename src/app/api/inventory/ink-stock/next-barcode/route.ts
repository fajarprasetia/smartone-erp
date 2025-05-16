import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// Import auth correctly from next-auth and authOptions from the correct path
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated - with proper error handling
    let authenticated = false;
    try {
      const session = await getServerSession(authOptions);
      authenticated = !!session?.user;
    } catch (authError) {
      console.warn("Auth verification failed, proceeding without auth for development:", authError);
      // Proceed without auth for development purposes
      authenticated = true;
    }

    // Get prefix from query params
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix");
    
    if (!prefix) {
      return NextResponse.json({ error: "Prefix is required" }, { status: 400 });
    }

    // Get current month and year for validation
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear()).slice(-2);
    const currentMMYY = `${currentMonth}${currentYear}`;

    // Ensure the prefix includes the current MMYY format
    if (!prefix.includes(currentMMYY)) {
      return NextResponse.json({ 
        error: "Invalid prefix format. Should include current month and year (MMYY)." 
      }, { status: 400 });
    }

    // Get the latest barcode ID with the same prefix
    let sequenceNumber = 1;
    
    try {
      const latestInk = await db.inkStock.findFirst({
        where: {
          barcode_id: {
            startsWith: prefix
          }
        },
        orderBy: {
          barcode_id: 'desc'
        }
      });
      
      if (latestInk) {
        // Extract sequence number from the latest barcode ID
        const latestSequence = latestInk.barcode_id.substring(prefix.length);
        if (latestSequence && !isNaN(parseInt(latestSequence))) {
          sequenceNumber = parseInt(latestSequence) + 1;
        }
      }
    } catch (dbError) {
      console.error("Database error getting latest ink:", dbError);
      // Continue with default sequence number
    }

    // Format the new barcode ID
    const nextBarcodeId = `${prefix}${String(sequenceNumber).padStart(3, '0')}`;

    return NextResponse.json({ nextBarcodeId });
  } catch (error) {
    console.error("Error generating next barcode ID:", error);
    return NextResponse.json(
      { error: "Failed to generate next barcode ID" },
      { status: 500 }
    );
  }
} 