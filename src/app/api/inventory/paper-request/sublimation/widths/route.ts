import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET: Fetch available widths for specific GSM
 * Endpoint: /api/inventory/paper-request/sublimation/widths?gsm=100
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

    // Get GSM from query params
    const url = new URL(req.url);
    const gsm = url.searchParams.get("gsm");

    if (!gsm) {
      return NextResponse.json(
        { error: "GSM parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching widths for GSM: ${gsm}`);

    // Get approved paper requests with the specified GSM
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

    // Filter for sublimation papers with the specified GSM and remaining length
    const papers = approvedRequests.filter(request => {
      const paperStock = request.paper_stock;
      if (!paperStock) return false;

      // Check if it's a sublimation paper (case insensitive)
      const paperType = (paperStock.type || "").toLowerCase();
      const isSublimation = paperType.includes("sublim");
      
      // Check if GSM matches and there's remaining length
      const stockGsm = paperStock.gsm ? String(paperStock.gsm) : null;
      const remainingLength = parseFloat(String(paperStock.remainingLength || 0));

      return isSublimation && stockGsm === gsm && remainingLength > 0;
    });

    console.log(`Found ${papers.length} sublimation papers with GSM ${gsm} and remaining length`);

    // Extract unique widths and sort them numerically
    const widths = [...new Set(
      papers
        .map(paper => paper.paper_stock?.width ? String(paper.paper_stock.width) : null)
        .filter(Boolean)
    )].sort((a, b) => parseInt(a || "0") - parseInt(b || "0"));

    // Calculate total remaining length for each width
    const widthsWithStock = widths.map(width => {
      const papersWithWidth = papers.filter(
        paper => paper.paper_stock?.width && String(paper.paper_stock.width) === width
      );
      
      const totalLength = papersWithWidth.reduce((sum, paper) => {
        return sum + parseFloat(String(paper.paper_stock?.remainingLength || 0));
      }, 0);
      
      return {
        width,
        totalAvailableLength: totalLength,
        stocks: papersWithWidth.map(paper => ({
          id: paper.id,
          paper_stock_id: paper.paper_stock_id,
          remaining_length: paper.paper_stock?.remainingLength
        }))
      };
    });

    return NextResponse.json({
      gsm,
      widths,
      widthsWithStock
    });
  } catch (error) {
    console.error("Error fetching widths for sublimation paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch widths for sublimation paper" },
      { status: 500 }
    );
  }
} 