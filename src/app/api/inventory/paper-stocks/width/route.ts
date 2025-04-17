import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch available paper widths based on a given GSM value
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gsm = searchParams.get("gsm");

    // Validate required GSM parameter
    if (!gsm) {
      return NextResponse.json(
        { error: "Missing required parameter: gsm" },
        { status: 400 }
      );
    }

    // Find all distinct widths for the given GSM that have stock available
    const paperWidths = await prisma.paperStock.groupBy({
      by: ['width'],
      where: {
        gsm: {
          equals: gsm,
          mode: 'insensitive'  // Case-insensitive matching
        },
        remaining_length: {
          gt: 0  // Only include paper with stock available
        },
        width: {
          not: null
        }
      },
      _sum: {
        remaining_length: true  // Calculate total remaining length per width
      },
      orderBy: {
        width: 'asc'  // Order results by width
      },
      having: {
        remaining_length: {
          _sum: {
            gt: 0  // Ensure the total remaining length is greater than zero
          }
        }
      }
    });

    // If no widths found, return empty array
    if (!paperWidths || paperWidths.length === 0) {
      return NextResponse.json([]);
    }

    // Format the response to include width and total remaining length
    const formattedWidths = paperWidths.map(item => ({
      width: item.width,
      remainingLength: item._sum.remaining_length
    }));

    return NextResponse.json(formattedWidths);
  } catch (error: any) {
    console.error("Error fetching paper widths:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch paper widths",
        message: error.message,
        details: String(error)
      },
      { status: 500 }
    );
  }
} 