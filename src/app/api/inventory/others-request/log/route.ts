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
    const { action, others_request_id, others_item_id, notes } = body

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      )
    }

    const logEntry = await prisma.OthersLog.create({
      data: {
        action,
        user_id: session.user.id,
        others_request_id: others_request_id || null,
        others_item_id: others_item_id || null,
        notes: notes || null,
      }
    })

    return NextResponse.json(
      { 
        message: "Activity logged successfully", 
        log: logEntry 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error logging activity:", error)
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("request_id")
    const itemId = searchParams.get("item_id")
    
    const filters: any = {}
    
    if (requestId) {
      filters.others_request_id = requestId
    }
    
    if (itemId) {
      filters.others_item_id = itemId
    }

    const logs = await prisma.OthersLog.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        others_request: true,
        others_item: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // Format logs for response
    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      performed_by: log.user.name,
      user_id: log.user_id,
      notes: log.notes,
      created_at: log.created_at,
      others_request_id: log.others_request_id,
      others_item_id: log.others_item_id,
      request_details: log.others_request || null,
      item_details: log.others_item || null,
    }))

    return NextResponse.json(
      { logs: formattedLogs },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
} 