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

// Sample fallback data to use when the database table doesn't exist
const fallbackMarketingUsers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com"
  },
  {
    id: "3",
    name: "Michael Taylor",
    email: "michael.taylor@example.com"
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com"
  }
];

// GET: Fetch all marketing users for order form
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching marketing users");
    
    try {
      // Fetch marketing users from the database - users with marketing role
      const marketingUsers = await prisma.user.findMany({
        where: {
          role: {
            contains: 'Marketing',
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // If no marketing-specific users found, return all users as a fallback
      if (marketingUsers.length === 0) {
        console.log("[API] No marketing-specific users found, returning all users");
        
        const allUsers = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
        
        return NextResponse.json(serializeData(allUsers));
      }

      console.log(`[API] Found ${marketingUsers.length} marketing users`);
      return NextResponse.json(serializeData(marketingUsers));
    } catch (dbError) {
      console.log("[API] Database error, returning fallback marketing users");
      console.error(dbError);
      return NextResponse.json(fallbackMarketingUsers);
    }
  } catch (error: any) {
    console.error("[API] Error fetching marketing users:", error);
    
    // Return fallback data as a last resort
    console.log("[API] Using fallback marketing user data");
    return NextResponse.json(fallbackMarketingUsers);
  }
} 