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
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    
    const filters: any = {}
    
    if (status) {
      filters.status = status
    }
    
    if (category) {
      filters.category = category
    }
    
    const requests = await prisma.othersRequest.findMany({
      where: filters,
      orderBy: {
        created_at: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    })
    
    return NextResponse.json({ requests }, { status: 200 })
  } catch (error) {
    console.error("Error fetching others requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch others requests" },
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
    
    const { category, item_name, quantity, unit, user_notes } = body
    
    if (!category || !item_name || !quantity || !unit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Create the others request
    const request = await prisma.othersRequest.create({
      data: {
        category,
        item_name,
        quantity,
        unit,
        user_notes: user_notes || "",
        status: "PENDING",
        user_id: session.user.id,
      },
    })
    
    // Log the request creation
    await prisma.othersLog.create({
      data: {
        action: "REQUESTED",
        others_request_id: request.id,
        user_id: session.user.id,
        notes: `Requested ${quantity} ${unit} of ${item_name}`,
      },
    })
    
    return NextResponse.json({ request }, { status: 201 })
  } catch (error) {
    console.error("Error creating others request:", error)
    return NextResponse.json(
      { error: "Failed to create others request" },
      { status: 500 }
    )
  }
} 