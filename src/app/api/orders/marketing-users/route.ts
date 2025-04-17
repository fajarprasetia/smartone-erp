import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET: Fetch marketing users
export async function GET() {
  try {
    console.log("[API] Fetching marketing users");
    
    try {
      // Fetch users from the database with role "Marketing"
      const marketingUsers = await prisma.user.findMany({
        where: {
          role: "Marketing", // Filter users by the Marketing role
        },
        select: {
          id: true,
          name: true, // Using the name field from the User table
        },
        orderBy: {
          name: 'asc',
        },
      });

      console.log(`[API] Found ${marketingUsers.length} marketing users`);
      
      // Format the data for the frontend
      const formattedUsers = marketingUsers.map(user => ({
        id: user.id,
        name: user.name,
      }));
      
      return NextResponse.json(serializeData(formattedUsers));
    } catch (dbError) {
      console.log("[API] Database error when fetching marketing users, returning empty array");
      console.error(dbError);
      
      // Return empty array to prevent frontend errors
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("[API] Error fetching marketing users:", error);
    
    // Return empty array as a last resort
    console.log("[API] Using empty array fallback for marketing users");
    return NextResponse.json([]);
  }
} 