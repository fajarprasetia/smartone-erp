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

// GET: Fetch all customers for order form
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching all customers");
    
    try {
      // Fetch customers from the database
      // Use correctly cased field names based on your actual database schema
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          nama: true, // Ensure we're using the correct field name from the database
          telp: true,
        },
        orderBy: {
          nama: 'asc',
        },
      });

      console.log(`[API] Found ${customers.length} customers`);
      
      // Map the data to the expected format - ensure field names match what the form expects
      const formattedCustomers = customers.map(customer => ({
        id: customer.id,
        nama: customer.nama,
        telp: customer.telp,
      }));
      
      return NextResponse.json(serializeData(formattedCustomers));
    } catch (dbError) {
      console.log("[API] Database error when fetching customers, returning empty array");
      console.error(dbError);
      
      // Return empty array instead of mock data to ensure app stability
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Error fetching customers:", error);
    
    // Return empty array as a last resort
    console.log("[API] Using empty array fallback for customers");
    return NextResponse.json([]);
  }
} 