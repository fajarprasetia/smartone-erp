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

    const { request_id, barcode_id } = await req.json();

    if (!request_id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (!barcode_id) {
      return NextResponse.json(
        { error: "Barcode ID is required" },
        { status: 400 }
      );
    }

    // Find the ink stock by barcode
    const inkStock = await db.inkStock.findUnique({
      where: { barcode_id: barcode_id }
    });

    if (!inkStock) {
      return NextResponse.json(
        { error: "Ink stock not found with the provided barcode" },
        { status: 404 }
      );
    }

    // Get the ink request
    const inkRequest = await db.inkRequest.findUnique({
      where: { id: request_id },
      include: {
        requester: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!inkRequest) {
      return NextResponse.json(
        { error: "Ink request not found" },
        { status: 404 }
      );
    }

    if (inkRequest.approved) {
      return NextResponse.json(
        { error: "This request has already been approved" },
        { status: 400 }
      );
    }

    if (inkRequest.rejected) {
      return NextResponse.json(
        { error: "Cannot approve a rejected request" },
        { status: 400 }
      );
    }

    // Validate that ink stock matches request requirements
    if (inkStock.type.toLowerCase() !== inkRequest.ink_type.toLowerCase() ||
        inkStock.color.toLowerCase() !== inkRequest.color.toLowerCase()) {
      return NextResponse.json(
        { error: "This ink stock does not match the requested ink type or color" },
        { status: 400 }
      );
    }

    if (inkStock.availability === "NO") {
      return NextResponse.json(
        { error: "This ink is no longer available" },
        { status: 400 }
      );
    }

    // Update the ink stock availability
    await db.inkStock.update({
      where: { id: inkStock.id },
      data: {
        availability: "NO",
        dateTaken: new Date(),
        takenByUserId: inkRequest.requested_by,
        approved: true
      }
    });

    // Update the ink request to mark it as approved and link to ink stock
    const updatedRequest = await db.inkRequest.update({
      where: { id: request_id },
      data: {
        status: "APPROVED",
        approved_by: session.user.id,
        ink_stock_id: inkStock.id,
        updated_at: new Date()
      }
    });

    // Log the approval activity - directly create log entry instead of using fetch
    try {
      await db.inkLog.create({
        data: {
          action: "APPROVED",
          ink_stock_id: inkStock.id,
          request_id: request_id,
          performed_by: session.user.id,
          notes: `Ink request approved by ${session.user.name}`,
          created_at: new Date()
        }
      });
    } catch (logError) {
      console.error("Error creating log entry:", logError);
      // Continue even if logging fails - don't fail the approval
    }

    return NextResponse.json({
      success: true,
      message: "Ink request approved successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("Error approving ink request:", error);
    return NextResponse.json(
      { error: "Failed to approve ink request" },
      { status: 500 }
    );
  }
} 