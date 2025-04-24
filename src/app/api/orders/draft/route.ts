import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to serialize BigInt values for JSON response
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(
      data,
      (key, value) => (typeof value === "bigint" ? value.toString() : value)
    )
  );
}

// GET to fetch all draft orders, optionally filtered
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const customerId = searchParams.get("customerId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset") as string) : 0;
    
    // Build where clause
    const where: any = { status: "DRAFT" };
    
    if (userId) {
      where.userId = BigInt(userId);
    }
    
    if (customerId) {
      where.customerId = BigInt(customerId);
    }
    
    // Fetch draft orders
    const drafts = await prisma.order.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      include: {
        customer: true,
      },
      skip: offset,
      take: limit,
    });
    
    // Count total drafts for pagination
    const totalCount = await prisma.order.count({ where });
    
    // Process data for response
    const processedDrafts = drafts.map((draft: any) => {
      let marketingInfo = null;
      if (draft.marketing) {
        marketingInfo = {
          name: draft.marketing,
        };
      }
      
      return {
        ...draft,
        marketingInfo,
      };
    });
    
    return NextResponse.json({
      drafts: serializeData(processedDrafts),
      totalCount,
      limit,
      offset,
    });
    
  } catch (error) {
    console.error("Error fetching draft orders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch draft orders",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// POST to create a new draft order
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Create a new draft order with minimal required info
    const newDraft = await prisma.order.create({
      data: {
        status: "DRAFT",
        userId: session.user.id,
        created_at: new Date(),
        updated_at: new Date(),
        // Optional fields from the request body
        customerId: body.customerId ? BigInt(body.customerId) : null,
        marketing: body.marketing || null,
        produk: body.produk || null,
        qty: body.qty || null,
        catatan: body.catatan || null,
      },
      include: {
        customer: true,
      },
    });
    
    // Process order for response
    let marketingInfo = null;
    if (newDraft.marketing) {
      marketingInfo = {
        name: newDraft.marketing,
      };
    }
    
    const processedDraft = {
      ...newDraft,
      marketingInfo,
    };
    
    // Create a log entry for the new draft
    await (prisma as any).orderLog.create({
      data: {
        orderId: newDraft.id,
        action: "CREATED",
        userId: session.user.id,
        notes: "Draft order created",
        created_at: new Date(),
      },
    });
    
    return NextResponse.json({
      draft: serializeData(processedDraft),
      message: "Draft order created successfully",
    });
    
  } catch (error) {
    console.error("Error creating draft order:", error);
    return NextResponse.json(
      {
        error: "Failed to create draft order",
        details: String(error),
      },
      { status: 500 }
    );
  }
} 