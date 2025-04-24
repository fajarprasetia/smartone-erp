import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    const category = searchParams.get("category")
    
    // Build filter based on query parameters
    let filter: any = {}
    
    if (action) {
      filter.action = action
    }
    
    // For category, we need to join with the others_request table
    const includeFilter: any = {
      user: {
        select: {
          id: true,
          name: true,
        }
      },
      others_request: true
    }
    
    // If category filter is applied, we'll filter after fetching
    const logs = await prisma.othersLog.findMany({
      where: filter,
      orderBy: {
        created_at: "desc"
      },
      include: includeFilter
    })
    
    // Apply category filter if provided
    const filteredLogs = category 
      ? logs.filter((log: any) => log.others_request?.category === category)
      : logs
    
    return NextResponse.json({ logs: filteredLogs }, { status: 200 })
  } catch (error) {
    console.error("Error fetching others logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch others logs" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    
    const { action, others_request_id, notes } = body
    
    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      )
    }
    
    // Create the log entry
    const logEntry = await prisma.othersLog.create({
      data: {
        action,
        others_request_id,
        user_id: session.user.id,
        notes: notes || "",
      },
    })
    
    return NextResponse.json({ log: logEntry }, { status: 201 })
  } catch (error) {
    console.error("Error creating others log:", error)
    return NextResponse.json(
      { error: "Failed to create others log" },
      { status: 500 }
    )
  }
} 