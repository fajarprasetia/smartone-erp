import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET: Fetch sublimation paper data for print form
 * Returns GSM values from paper_requests with "Sublimation Paper" type validation
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

    console.log(`Found ${approvedRequests.length} approved paper requests with paper_stock_id`);

    // Filter for sublimation papers with remaining length
    const sublimationPapers = approvedRequests.filter(request => {
      // Check if paper_stock exists and is sublimation paper
      const paperStock = request.paper_stock;
      if (!paperStock) return false;

      // Check if it's a sublimation paper (case insensitive)
      const paperType = (paperStock.type || "").toLowerCase();
      const isSublimation = paperType.includes("sublim");

      // Check if there's remaining length
      const remainingLength = parseFloat(String(paperStock.remainingLength || 0));

      return isSublimation && remainingLength > 0;
    });

    console.log(`Found ${sublimationPapers.length} sublimation papers with remaining length`);

    // Extract unique GSM values
    const gsms = [...new Set(
      sublimationPapers
        .map(paper => paper.paper_stock?.gsm ? String(paper.paper_stock.gsm) : null)
        .filter(Boolean)
    )].sort((a, b) => parseInt(a || "0") - parseInt(b || "0"));

    // Create a map of widths by GSM
    const widthsByGsm: Record<string, string[]> = {};
    gsms.forEach(gsm => {
      const papersWithGsm = sublimationPapers.filter(
        paper => paper.paper_stock?.gsm && String(paper.paper_stock.gsm) === gsm
      );
      
      const widths = [...new Set(
        papersWithGsm
          .map(paper => paper.paper_stock?.width ? String(paper.paper_stock.width) : null)
          .filter(Boolean) as string[]
      )].sort((a, b) => parseInt(a || "0") - parseInt(b || "0"));
      
      widthsByGsm[gsm as string] = widths;
    });

    // Return the data
    return NextResponse.json({
      gsms,
      widthsByGsm,
      stocks: sublimationPapers.map(paper => ({
        id: paper.id,
        paper_stock_id: paper.paper_stock_id,
        gsm: paper.paper_stock?.gsm,
        width: paper.paper_stock?.width,
        type: paper.paper_stock?.type,
        remaining_length: paper.paper_stock?.remainingLength
      }))
    });
  } catch (error) {
    console.error("Error fetching sublimation paper data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sublimation paper data" },
      { status: 500 }
    );
  }
} 