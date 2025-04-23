import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  try {
    return JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Error serializing data:", error);
    // Fallback to a simpler serialization
    return { ...data };
  }
}

// Generate a date prefix in MMYY format
function generateDatePrefix() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  return `${month}${year}`;
}

// Format SPK number - if number > 999, don't pad with zeros
function formatSPKNumber(datePrefix: string, number: number): string {
  if (number <= 999) {
    return `${datePrefix}${String(number).padStart(3, '0')}`;
  } else {
    return `${datePrefix}${number}`;
  }
}

// GET: Generate a new SPK number
export async function GET() {
  try {
    console.log("[API] Generating new SPK number");
    
    const datePrefix = generateDatePrefix();
    let newSpk;
    
    // Direct query approach to avoid TypeScript issues
    try {
      // First clean up expired reservations
      // @ts-ignore - Model exists but TypeScript definitions may be out of sync
      await prisma.tempSpkReservation.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      // Find or create a counter for the current month/year
      // @ts-ignore - Model exists but TypeScript definitions may be out of sync
      const spkCounter = await prisma.spkCounter.upsert({
        where: { prefix: datePrefix },
        update: { 
          lastValue: { increment: 1 } 
        },
        create: {
              prefix: datePrefix,
          lastValue: 1
        },
      });
      
      // Format the SPK number
      newSpk = formatSPKNumber(datePrefix, spkCounter.lastValue);
      
      // Create a temporary reservation for this SPK
      // @ts-ignore - Model exists but TypeScript definitions may be out of sync
      await prisma.tempSpkReservation.create({
          data: {
            spk: newSpk,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes reservation
          },
        });
      
      console.log(`[API] Generated SPK: ${newSpk}`);
      
      return NextResponse.json(
        { spk: newSpk },
        { status: 200 }
      );
    } catch (innerError) {
      console.error("Error in SPK generation with specific models:", innerError);
      throw innerError; // Re-throw to trigger fallback
    }
    
  } catch (error: any) {
    console.error("Error generating SPK number:", error);
    
    // For debugging, log the detailed error
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    
    // Fallback: Find the highest SPK number from existing orders
    try {
      const datePrefix = generateDatePrefix();
      
      const highestOrder = await prisma.order.findFirst({
        where: {
          spk: {
            startsWith: datePrefix,
          },
        },
        orderBy: {
          spk: 'desc',
        },
      });
      
      let nextNumber = 1;
      
      if (highestOrder && highestOrder.spk) {
        // Extract the numeric part, accounting for values > 999
        const numericPart = highestOrder.spk.substring(4);
        if (!isNaN(parseInt(numericPart))) {
          nextNumber = parseInt(numericPart) + 1;
        }
      }
      
      // Format the SPK
      const fallbackSpk = formatSPKNumber(datePrefix, nextNumber);
      
      console.log(`[API] Generated fallback SPK from highest order + 1: ${fallbackSpk}`);
      
      return NextResponse.json(
        { spk: fallbackSpk, fallback: true },
        { status: 200 }
      );
    } catch (fallbackError) {
      console.error("Fallback SPK generation also failed:", fallbackError);
      
      // Ultimate fallback - completely random SPK
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const randomNumber = Math.floor(100 + Math.random() * 900);
      const ultimateFallbackSpk = `${month}${year}${String(randomNumber).padStart(3, '0')}`;
      
      console.log(`[API] Using ultimate random fallback SPK: ${ultimateFallbackSpk}`);
      
      return NextResponse.json(
        { spk: ultimateFallbackSpk, fallback: true },
        { status: 200 }
      );
    }
  }
} 