import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { request_id, rejection_reason } = body

    if (!request_id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    // Check if the request exists and is not already processed
    const othersRequest = await prisma.OthersRequest.findUnique({
      where: { id: request_id },
    })

    if (!othersRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    if (othersRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot reject an already approved request" },
        { status: 400 }
      )
    }

    if (othersRequest.status === "REJECTED") {
      return NextResponse.json(
        { error: "Request already rejected" },
        { status: 400 }
      )
    }

    // Update the request status to rejected
    const updatedRequest = await prisma.OthersRequest.update({
      where: { id: request_id },
      data: {
        status: "REJECTED",
        rejector_id: session.user.id,
        rejection_reason: rejection_reason || null,
        rejected_at: new Date(),
      },
    })
    
    // Log the rejection
    await prisma.OthersLog.create({
      data: {
        action: "REJECTED",
        user_id: session.user.id,
        others_request_id: request_id,
        notes: `Request rejected: ${rejection_reason || "No reason provided"}`,
      },
    })

    return NextResponse.json(
      { message: "Request rejected successfully", request: updatedRequest },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error rejecting request:", error)
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    )
  }
} 