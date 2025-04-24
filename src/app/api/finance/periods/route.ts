import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters for potential filtering
    const url = new URL(req.url)
    const type = url.searchParams.get("type")
    const year = url.searchParams.get("year")
    const status = url.searchParams.get("status")

    // Build the where clause dynamically
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (year) {
      where.year = parseInt(year)
    }
    
    if (status) {
      where.status = status
    }

    // Fetch financial periods
    const periods = await db.financialPeriod.findMany({
      where,
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        type: true, 
        year: true,
        quarter: true,
        month: true,
        status: true,
        createdAt: true
      },
      orderBy: [
        { startDate: 'desc' }
      ]
    })

    return NextResponse.json(periods)
  } catch (error) {
    console.error("Error fetching financial periods:", error)
    return NextResponse.json(
      { error: "Failed to fetch financial periods" },
      { status: 500 }
    )
  }
}

// Create a new financial period
export async function POST(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await req.json()
    const { name, startDate, endDate, type, year, quarter, month, status } = body
    
    // Validate required fields
    if (!name || !startDate || !endDate || !type || !year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Check for overlapping periods
    const overlappingPeriod = await db.financialPeriod.findFirst({
      where: {
        OR: [
          {
            startDate: {
              lte: new Date(endDate)
            },
            endDate: {
              gte: new Date(startDate)
            }
          }
        ]
      }
    })
    
    if (overlappingPeriod) {
      return NextResponse.json(
        { error: "The date range overlaps with an existing period" },
        { status: 400 }
      )
    }
    
    // Create new financial period
    const newPeriod = await db.financialPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        year: parseInt(year.toString()),
        quarter: quarter ? parseInt(quarter.toString()) : null,
        month: month ? parseInt(month.toString()) : null,
        status: status || "OPEN",
        createdBy: session.user.id
      }
    })
    
    return NextResponse.json(newPeriod)
  } catch (error) {
    console.error("Error creating financial period:", error)
    return NextResponse.json(
      { error: "Failed to create financial period" },
      { status: 500 }
    )
  }
} 