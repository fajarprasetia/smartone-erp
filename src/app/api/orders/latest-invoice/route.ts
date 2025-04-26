import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const prefix = url.searchParams.get("prefix");
    
    if (!prefix) {
      return NextResponse.json(
        { error: "Prefix parameter is required" },
        { status: 400 }
      );
    }
    
    // Find the latest invoice number with the given prefix
    const orders = await db.order.findMany({
      where: {
        invoice: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoice: 'desc',
      },
      take: 1,
      select: {
        invoice: true,
      },
    });
    
    const latestInvoice = orders.length > 0 ? orders[0].invoice : null;
    
    return NextResponse.json({
      success: true,
      latestInvoice,
    });
    
  } catch (error: any) {
    console.error("Error fetching latest invoice number:", error);
    
    return NextResponse.json(
      {
        error: "Failed to fetch latest invoice number",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 