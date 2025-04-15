import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();
    const { ink_type, color, quantity, unit, user_notes, ink_stock_id } = data;

    // Validate required fields
    if (!ink_type || !color || !quantity || !unit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create ink request
    const inkRequest = await db.inkRequest.create({
      data: {
        ink_type,
        color,
        quantity: parseFloat(quantity),
        unit,
        user_notes: user_notes || '',
        requested_by: userId,
        status: "PENDING",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Log the activity
    await db.inkLog.create({
      data: {
        action: "REQUEST",
        performed_by: userId,
        request_id: inkRequest.id,
        notes: `Request for ${quantity} ${unit} of ${color} ${ink_type} ink`,
        created_at: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Ink request created successfully", id: inkRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating ink request:", error);
    return NextResponse.json(
      { error: "Failed to create ink request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const include = searchParams.get("include");
    
    // Build the query
    const query: any = {
      where: {},
      orderBy: {
        created_at: "desc"
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    };
    
    // Add status filter if provided
    if (status) {
      query.where.status = {
        in: status.split(",")
      };
    }
    
    // Add additional includes if requested
    if (include) {
      const includes = include.split(",");
      
      if (includes.includes("ink_stock")) {
        query.include.ink_stock = true;
      }
    }
    
    const inkRequests = await db.inkRequest.findMany(query);
    
    // Map and transform the response
    const mappedRequests = inkRequests.map(request => ({
      ...request,
      user_name: request.requester?.name,
      requester_name: request.requester?.name,
      // Remove sensitive user information
      requester: undefined
    }));
    
    return NextResponse.json(mappedRequests);
  } catch (error) {
    console.error("Error fetching ink requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch ink requests" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();
    const { id, status, admin_notes } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the ink request
    const updatedRequest = await db.ink_requests.update({
      where: { id },
      data: {
        status,
        admin_notes: admin_notes || '',
        approvedByUserId: status === "APPROVED" ? userId : null,
        approvalDate: status === "APPROVED" ? new Date() : null,
      },
    });

    // If approved, update the ink stock
    if (status === "APPROVED") {
      // Get the ink request with ink stock
      const inkRequest = await db.ink_requests.findUnique({
        where: { id },
        select: {
          ink_stock_id: true,
          quantity: true,
          unit: true,
        },
      });

      if (inkRequest && inkRequest.ink_stock_id) {
        // Update the ink stock availability
        await db.ink_stocks.update({
          where: { id: inkRequest.ink_stock_id },
          data: {
            availability: "NO",
            dateTaken: new Date(),
            takenByUserId: updatedRequest.requestedByUserId,
          },
        });
      }
    }

    // Log the activity
    await db.activity_logs.create({
      data: {
        activity_type: `INK_REQUEST_${status}`,
        user_id: userId,
        details: JSON.stringify({
          ink_request_id: id,
          status,
          admin_notes,
        }),
        timestamp: new Date(),
      },
    });

    return NextResponse.json(
      { message: `Ink request ${status.toLowerCase()}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating ink request:", error);
    return NextResponse.json(
      { error: "Failed to update ink request" },
      { status: 500 }
    );
  }
} 