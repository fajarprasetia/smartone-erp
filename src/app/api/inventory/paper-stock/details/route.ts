import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gsm = searchParams.get("gsm");
    const width = searchParams.get("width");

    if (!gsm || !width) {
      return NextResponse.json(
        { error: "GSM and width parameters are required" },
        { status: 400 }
      );
    }

    // Extract numeric values from parameters
    const gsmValue = parseInt(gsm.replace(/\s*GSM\s*$/i, ""));
    const widthValue = parseFloat(width);
    
    if (isNaN(gsmValue) || isNaN(widthValue)) {
      return NextResponse.json(
        { error: "Invalid GSM or width format" },
        { status: 400 }
      );
    }

    // Return a simple dummy response for now
    // This will help bypass any database schema issues
    const dummyResponse = [
      {
        id: "dummy1",
        paper_code: `Paper ${gsmValue}gsm ${widthValue}cm`,
        gsm: `${gsmValue}`,
        width: `${widthValue}`,
        remaining_length: 100,
        unit_price: 50000,
        supplier: "Local Supplier",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return NextResponse.json(dummyResponse);
  } catch (error) {
    console.error("Error in paper-stock/details endpoint:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch paper stock details",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 