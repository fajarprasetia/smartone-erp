import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET: Fetch specific stock details for sublimation paper by GSM and width
 * Endpoint: /api/inventory/paper-request/sublimation/stocks?gsm=100&width=1600
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

    // Get GSM and width from query params
    const url = new URL(req.url);
    const gsm = url.searchParams.get("gsm");
    const width = url.searchParams.get("width");

    if (!gsm || !width) {
      return NextResponse.json(
        { error: "GSM and width parameters are required" },
        { status: 400 }
      );
    }

    console.log(`Fetching stocks for GSM: ${gsm}, Width: ${width}`);

    // Get approved paper requests
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

    // Filter for sublimation papers with the specified GSM and width
    const papers = approvedRequests.filter(request => {
      const paperStock = request.paper_stock;
      if (!paperStock) return false;

      // Check if it's a sublimation paper (case insensitive)
      const paperType = (paperStock.type || "").toLowerCase();
      const isSublimation = paperType.includes("sublim");
      
      // Check if GSM and width match and there's remaining length
      const stockGsm = paperStock.gsm ? String(paperStock.gsm) : null;
      const stockWidth = paperStock.width ? String(paperStock.width) : null;
      const remainingLength = parseFloat(String(paperStock.remainingLength || 0));

      return (
        isSublimation && 
        stockGsm === gsm && 
        stockWidth === width && 
        remainingLength > 0
      );
    });

    console.log(`Found ${papers.length} sublimation papers matching GSM ${gsm} and width ${width}`);

    // Sort papers by oldest first (FIFO inventory principle)
    const sortedPapers = papers.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    // Prepare detailed stock information
    const stocks = sortedPapers.map(paper => ({
      id: paper.id,
      paper_stock_id: paper.paper_stock_id,
      supplier: paper.supplier,
      po_number: paper.po_number,
      batch_number: paper.batch_number,
      request_date: paper.createdAt,
      approval_date: paper.updatedAt,
      width: paper.paper_stock?.width,
      gsm: paper.paper_stock?.gsm,
      remaining_length: paper.paper_stock?.remainingLength,
      original_length: paper.paper_stock?.length,
      brand: paper.brand
    }));

    // Calculate total available length
    const totalAvailableLength = stocks.reduce((sum, stock) => {
      return sum + parseFloat(String(stock.remaining_length || 0));
    }, 0);

    return NextResponse.json({
      gsm,
      width,
      totalAvailableLength,
      stocks
    });
  } catch (error) {
    console.error("Error fetching stocks for sublimation paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocks for sublimation paper" },
      { status: 500 }
    );
  }
} 