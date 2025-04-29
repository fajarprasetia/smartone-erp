import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
        rejector: {
          select: {
            id: true,
            name: true,
          }
        },
        item: {
          select: {
            id: true,
            item_name: true,
            category: true,
            unit: true,
          }
        }
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { item_id, quantity, user_notes } = body

    // Validate required fields
    if (!item_id || !quantity) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 }
      )
    }

    // Check if item exists and is available
    const item = await prisma.othersItem.findUnique({
      where: { id: item_id },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    if (!item.availability) {
      return NextResponse.json(
        { error: "Item is not available" },
        { status: 400 }
      )
    }

    if (item.quantity < quantity) {
      return NextResponse.json(
        { error: "Requested quantity exceeds available quantity" },
        { status: 400 }
      )
    }

    // Create the request
    const request = await prisma.othersRequest.create({
      data: {
        user_id: session.user.id,
        item_id: item_id,
        category: item.category,
        item_name: item.item_name,
        quantity: quantity,
        unit: item.unit,
        user_notes: user_notes,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Create log entry
    await prisma.othersLog.create({
      data: {
        action: "REQUESTED",
        user_id: session.user.id,
        others_request_id: request.id,
        notes: `Requested ${quantity} ${item.unit} of ${item.item_name}`,
      }
    })

    return NextResponse.json({ request }, { status: 201 })
  } catch (error) {
    console.error("Error creating others request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
} 