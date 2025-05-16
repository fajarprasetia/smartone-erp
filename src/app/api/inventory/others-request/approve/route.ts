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
    const { request_id } = body

    if (!request_id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    // Check if the request exists and is not already processed
    const othersRequest = await prisma.othersRequest.findUnique({
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
        { error: "Request already approved" },
        { status: 400 }
      )
    }

    if (othersRequest.status === "REJECTED") {
      return NextResponse.json(
        { error: "Cannot approve a rejected request" },
        { status: 400 }
      )
    }

    // Update the request status to approved
    const updatedRequest = await prisma.othersRequest.update({
      where: { id: request_id },
      data: {
        status: "APPROVED",
        approver_id: session.user.id,
        approved_at: new Date(),
      },
    })
    
    // Log the approval
    await prisma.othersLog.create({
      data: {
        action: "APPROVED",
        user_id: session.user.id,
        others_request_id: request_id,
        notes: `Request approved`,
      },
    })

    return NextResponse.json(
      { message: "Request approved successfully", request: updatedRequest },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error approving request:", error)
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    )
  }
} 