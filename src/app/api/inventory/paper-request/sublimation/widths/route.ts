import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET: Fetch available widths for a specific GSM value
 * Returns width values from paper_stocks for Sublimation Paper type
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get GSM parameter from query
    const url = new URL(req.url);
    const gsm = url.searchParams.get("gsm");

    if (!gsm) {
      return NextResponse.json(
        { error: "GSM parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching widths for GSM: ${gsm}`);

    // Get all approved paper requests that have a paper_stock_id
    const approvedRequests = await db.paperRequest.findMany({
      where: {
        status: "APPROVED",
        paper_stock_id: {
          not: null
        }
      },
      include: {
        paper_stock: true
      }
    });

    // Filter for sublimation papers with specific GSM and remaining length
    const papersWithGsm = approvedRequests.filter(request => {
      // Check if paper_stock exists and is sublimation paper
      const paperStock = request.paper_stock;
      if (!paperStock) return false;

      // Check GSM
      const stockGsm = String(paperStock.gsm || "");
      const matchesGsm = stockGsm === gsm;

      // Check if it's a sublimation paper (case insensitive)
      const paperType = (paperStock.type || "").toLowerCase();
      const isSublimation = paperType.includes("sublim");

      // Check if there's remaining length
      const remainingLength = parseFloat(String(paperStock.remainingLength || 0));

      return matchesGsm && isSublimation && remainingLength > 0;
    });

    console.log(`Found ${papersWithGsm.length} sublimation papers with GSM ${gsm}`);

    // Extract and sort unique width values
    const widths = [...new Set(
      papersWithGsm
        .map(paper => paper.paper_stock?.width ? String(paper.paper_stock.width) : null)
        .filter(Boolean)
    )].sort((a, b) => parseInt(a || "0") - parseInt(b || "0"));

    console.log(`Available widths for GSM ${gsm}:`, widths);

    // Filter out papers with no remaining length
    const availablePapers = papersWithGsm.filter(paper => paper.paper_stock?.remainingLength && paper.paper_stock.remainingLength > 0);
    
    // Group papers by width and calculate total remaining length
    const widthGroups = availablePapers.reduce((acc, paper) => {
      const width = paper.paper_stock?.width;
      if (!width) return acc;
      
      if (!acc[width]) {
        acc[width] = {
          width,
          totalLength: 0,
          papers: []
        };
      }
      acc[width].totalLength += paper.paper_stock?.remainingLength || 0;
      acc[width].papers.push(paper);
      return acc;
    }, {} as Record<number, { width: number; totalLength: number; papers: typeof papersWithGsm }>);

    // Return the data
    return NextResponse.json({
      gsm,
      widths,
      stocks: papersWithGsm.map(paper => ({
        id: paper.id,
        paper_stock_id: paper.paper_stock_id,
        width: paper.paper_stock?.width,
        remainingLength: paper.paper_stock?.remainingLength
      }))
    });
  } catch (error) {
    console.error(`Error fetching widths for GSM:`, error);
    return NextResponse.json(
      { error: "Failed to fetch paper widths" },
      { status: 500 }
    );
  }
} 