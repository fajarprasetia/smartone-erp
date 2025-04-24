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

// GET: Fetch all marketing users for order form
export async function GET(req: NextRequest) {
  try {
    console.log("[API] Fetching marketing users");
    
    // Fetch marketing users from the database - users with marketing role
    const marketingUsers = await prisma.user.findMany({
      where: {
        role: {
          name: "Marketing" // Filter users with roles named "Marketing"
        }
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

    console.log(`[API] Found ${marketingUsers.length} marketing users`);
    return NextResponse.json(serializeData(marketingUsers));
  } catch (error: any) {
    console.error("[API] Error fetching marketing users:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing users", details: error.message },
      { status: 500 }
    );
  }
} 