import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const reqData = await request.json();
    const { request_id, rejection_reason } = reqData;

    // Validate request parameters
    if (!request_id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Get the ink request
    const inkRequest = await db.ink_request.findUnique({
      where: { id: request_id },
    });

    if (!inkRequest) {
      return NextResponse.json(
        { error: "Ink request not found" },
        { status: 404 }
      );
    }

    // Check if already approved or rejected
    if (inkRequest.approved) {
      return NextResponse.json(
        { error: "Cannot reject an already approved request" },
        { status: 400 }
      );
    }

    if (inkRequest.rejected) {
      return NextResponse.json(
        { error: "This request has already been rejected" },
        { status: 400 }
      );
    }

    // Update the ink request
    const updatedRequest = await db.ink_request.update({
      where: { id: request_id },
      data: {
        rejected: true,
        rejected_by_id: userId,
        rejected_date: new Date(),
        rejection_reason: rejection_reason || null,
      },
    });

    // Log the activity
    try {
      await fetch(new URL("/api/log", request.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "REJECT_INK_REQUEST",
          module: "inventory",
          description: `Ink request ${request_id} rejected by ${session.user.name}`,
          user_id: userId,
          metadata: {
            request_id,
            ink_type: inkRequest.ink_type,
            color: inkRequest.color,
            rejection_reason,
          },
        }),
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Continue execution even if logging fails
    }

    return NextResponse.json(
      { message: "Ink request rejected successfully", data: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting ink request:", error);
    return NextResponse.json(
      { error: "Failed to reject ink request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 