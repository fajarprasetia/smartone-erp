import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { request_id, approver_notes } = await req.json()

    if (!request_id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    const request = await prisma.othersRequest.findUnique({
      where: { id: request_id },
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request is not in pending status" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.othersRequest.update({
        where: { id: request_id },
        data: {
          status: "APPROVED",
          approver_id: session.user.id,
          approved_at: new Date(),
          approver_notes: approver_notes,
        },
      })

      // Update item quantity
      await tx.othersItem.update({
        where: { id: request.item_id },
        data: {
          quantity: {
            decrement: request.quantity,
          },
        },
      })

      // Create log entry
      await tx.othersLog.create({
        data: {
          others_request_id: request_id,
          action: "APPROVED",
          user_id: session.user.id,
          notes: approver_notes || "Request approved",
        },
      })

      return updatedRequest
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error approving request:", error)
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    )
  }
} 