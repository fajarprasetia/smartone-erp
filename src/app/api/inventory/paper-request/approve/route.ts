import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Approve a paper request
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
    
    if (!data.id) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 }
      );
    }

    // Get the paper request
    const paperRequest = await prisma.paperRequest.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!paperRequest) {
      return NextResponse.json(
        { error: "Paper request not found" },
        { status: 404 }
      );
    }

    if (paperRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    // Update the request status
    const updatedRequest = await prisma.paperRequest.update({
      where: {
        id: data.id,
      },
      data: {
        status: "APPROVED",
        approved_by: userId,
      },
      include: {
        requester: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create log entry
    await prisma.paperLog.create({
      data: {
        action: "APPROVED",
        performed_by: userId,
        notes: `Approved request for ${paperRequest.paper_type}, ${paperRequest.gsm} GSM, ${paperRequest.width}x${paperRequest.length}cm`,
        request_id: paperRequest.id,
      },
    });

    return NextResponse.json({
      ...updatedRequest,
      requester_name: updatedRequest.requester?.name,
    }, { status: 200 });
  } catch (error) {
    console.error("Error approving paper request:", error);
    return NextResponse.json(
      { error: "Error approving paper request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 