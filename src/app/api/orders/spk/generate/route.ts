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

// Generate a new SPK number based on current date
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
      console.log(`[API] Found latest SPK with prefix ${spkPrefix}: ${latestSpk}`);
      
      // Extract the numeric part (last 3 characters)
      const numericPart = latestSpk.substring(4);
      
      if (!isNaN(parseInt(numericPart))) {
        nextNumber = parseInt(numericPart) + 1;
        console.log(`[API] Extracted numeric part: ${numericPart}, Next number: ${nextNumber}`);
      } else {
        console.log(`[API] Could not extract valid numeric part from ${latestSpk}, using default next number: 1`);
      }
    } else {
      console.log(`[API] No existing SPK with prefix ${spkPrefix} found, using initial number: 1`);
    }
    
    // Format the number part to have 3 digits with leading zeros
    const formattedNumber = String(nextNumber).padStart(3, '0');
    
    // Create the complete SPK
    const newSpk = `${spkPrefix}${formattedNumber}`;
    
    // Verify that the generated SPK doesn't already exist (as an additional safety check)
    const existingOrder = await db.order.findFirst({
      where: {
        spk: newSpk,
      },
    });
    
    // If the SPK already exists (which should not happen normally), increment again
    if (existingOrder) {
      console.log(`[API] SPK ${newSpk} already exists, incrementing further`);
      const incrementedNumber = nextNumber + 1;
      const incrementedFormattedNumber = String(incrementedNumber).padStart(3, '0');
      const incrementedNewSpk = `${spkPrefix}${incrementedFormattedNumber}`;
      
      console.log(`[API] Generated new incremented SPK: ${incrementedNewSpk}`);
      return NextResponse.json(serializeData({ spk: incrementedNewSpk }));
    }
    
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