import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// Generate a new SPK number based on current date and time
function generateNewSpk() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  // Get current date in format MMYY
  const datePrefix = `${month}${year}`;
  
  return datePrefix; // Will be completed with a sequential number
}

// GET: Generate a new SPK number
export async function GET() {
  try {
    console.log("[API] Generating new SPK number");
    
    // Generate the date part of the SPK (MMYY)
    const spkPrefix = generateNewSpk();
    
    // Find the highest SPK with the same prefix to determine the next number
    const latestOrders = await db.order.findMany({
      where: {
        spk: {
          startsWith: spkPrefix,
          not: null,
        },
      },
      orderBy: {
        spk: 'desc',
      },
      take: 1,
      select: {
        spk: true,
      },
    });
    
    let nextNumber = 1;
    
    // If there's an existing SPK with this prefix, increment its number
    if (latestOrders.length > 0 && latestOrders[0].spk) {
      const latestSpk = latestOrders[0].spk;
      // Extract the numeric part (last 4 characters)
      const numericPart = latestSpk.substring(4);
      if (!isNaN(parseInt(numericPart))) {
        nextNumber = parseInt(numericPart) + 1;
      }
    }
    
    // Format the number part to have 4 digits with leading zeros
    const formattedNumber = String(nextNumber).padStart(4, '0');
    
    // Create the complete SPK
    const newSpk = `${spkPrefix}${formattedNumber}`;
    
    console.log(`[API] Generated new SPK: ${newSpk}`);
    
    return NextResponse.json(serializeData({ spk: newSpk }));
  } catch (error: any) {
    console.error("Error generating SPK number:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate SPK number",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 