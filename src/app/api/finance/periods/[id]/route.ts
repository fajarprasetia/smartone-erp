import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

// Get a specific financial period by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const id = params.id

    // Fetch the financial period
    const period = await db.financialPeriod.findUnique({
      where: { id },
    })

    if (!period) {
      return NextResponse.json(
        { error: "Financial period not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(period)
  } catch (error) {
    console.error("Error fetching financial period:", error)
    return NextResponse.json(
      { error: "Failed to fetch financial period" },
      { status: 500 }
    )
  }
}

// Update a financial period
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const id = params.id
    const body = await req.json()
    
    // Validate that the period exists
    const existingPeriod = await db.financialPeriod.findUnique({
      where: { id },
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: "Financial period not found" },
        { status: 404 }
      )
    }

    // Extract updatable fields
    const { name, startDate, endDate, type, year, quarter, month, status } = body

    // Validate status if provided
    if (status && !["OPEN", "CLOSED", "PENDING"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    // Check for overlapping periods if dates are being updated
    if (startDate && endDate) {
      const overlappingPeriod = await db.financialPeriod.findFirst({
        where: {
          id: { not: id },
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
    }

    // Prepare data for update
    const updateData: any = {}
    
    if (name) updateData.name = name
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (type) updateData.type = type
    if (year) updateData.year = parseInt(year.toString())
    if (quarter !== undefined) updateData.quarter = quarter ? parseInt(quarter.toString()) : null
    if (month !== undefined) updateData.month = month ? parseInt(month.toString()) : null
    if (status) updateData.status = status
    
    // Add updatedBy and updatedAt
    updateData.updatedBy = session.user.id
    updateData.updatedAt = new Date()

    // Update the financial period
    const updatedPeriod = await db.financialPeriod.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedPeriod)
  } catch (error) {
    console.error("Error updating financial period:", error)
    return NextResponse.json(
      { error: "Failed to update financial period" },
      { status: 500 }
    )
  }
}

// Delete a financial period
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const id = params.id

    // Check if the period exists
    const existingPeriod = await db.financialPeriod.findUnique({
      where: { id },
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: "Financial period not found" },
        { status: 404 }
      )
    }

    // Check if there are related records that would prevent deletion
    // This will depend on your specific business logic and database schema
    // For example, you might check for transactions linked to this period

    // Delete the financial period
    await db.financialPeriod.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting financial period:", error)
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: "Cannot delete this financial period as it has related records" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to delete financial period" },
      { status: 500 }
    )
  }
} 