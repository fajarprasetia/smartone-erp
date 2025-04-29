import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch all paper requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    const includePaperStock = searchParams.get('include') === 'paper_stock';
    
    // Build the where clause based on provided filters
    let whereClause: any = {};
    
    if (statusParam) {
      // Handle comma-separated status values (e.g., "PENDING,APPROVED")
      const statusValues = statusParam.split(',');
      if (statusValues.length > 1) {
        whereClause.status = {
          in: statusValues
        };
      } else {
        whereClause.status = statusParam;
      }
    }
    
    const paperRequests = await prisma.paperRequest.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
        rejecter: {
          select: {
            id: true,
            name: true,
          },
        },
        paper_stock: includePaperStock,
      },
    });

    // Transform the results to include user names and match the format of the frontend model
    const transformedRequests = paperRequests.map((request: any) => ({
      ...request,
      id: request.id,
      paper_type: request.paper_type,
      paperType: request.paper_type, // Add for consistency with frontend model
      gsm: request.gsm,
      width: request.width,
      length: request.length,
      status: request.status,
      user_notes: request.user_notes || null,
      created_at: request.created_at.toISOString(),
      updated_at: request.updated_at.toISOString(),
      requested_at: request.created_at.toISOString(),
      user_name: request.requester?.name || null,
      requester_name: request.requester?.name || null,
      approver_name: request.approver?.name || null,
      rejecter_name: request.rejecter?.name || null,
      // Only include paper_stock if specifically requested and available
      paper_stock: includePaperStock && request.paper_stock ? {
        id: request.paper_stock.id,
        remainingLength: request.paper_stock.remainingLength,
      } : undefined,
    }));

    return NextResponse.json(transformedRequests);
  } catch (error) {
    console.error("Error fetching paper requests:", error);
    return NextResponse.json(
      { error: "Error fetching paper requests", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new paper request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();
    
    // Validate required fields
    if (!data.paper_type || !data.gsm || !data.width || !data.length) {
      return NextResponse.json(
        { error: "Missing required fields", details: "Paper type, GSM, width, and length are required" },
        { status: 400 }
      );
    }
    
    // Create the paper request
    const newPaperRequest = await prisma.paperRequest.create({
      data: {
        requested_by: userId,
        paper_type: data.paper_type,
        gsm: data.gsm,
        width: data.width,
        length: data.length,
        user_notes: data.user_notes || null,
        status: "PENDING",
      },
    });

    // Create a log entry for the new paper request
    await prisma.paperLog.create({
      data: {
        action: "REQUESTED",
        performed_by: userId,
        notes: `Requested paper: ${data.gsm} GSM, ${data.width}x${data.length}cm`,
        request_id: newPaperRequest.id,
      },
    });

    return NextResponse.json(newPaperRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating paper request:", error);
    return NextResponse.json(
      { error: "Error creating paper request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 