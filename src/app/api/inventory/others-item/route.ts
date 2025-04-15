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
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category")
    const availability = searchParams.get("availability")
    
    const filters: any = {}
    
    if (category) {
      filters.category = category
    }
    
    if (availability) {
      filters.availability = availability === "YES"
    }
    
    const items = await prisma.othersItem.findMany({
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
        taken_by_user: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    })
    
    return NextResponse.json({ items }, { status: 200 })
  } catch (error) {
    console.error("Error fetching other items:", error)
    return NextResponse.json(
      { error: "Failed to fetch other items" },
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
    
    const { 
      qr_code, 
      category, 
      item_name, 
      description, 
      quantity, 
      unit, 
      location, 
      notes 
    } = body
    
    if (!category || !item_name || !quantity || !unit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Check if QR code already exists
    if (qr_code) {
      const existingItem = await prisma.othersItem.findUnique({
        where: { qr_code }
      })
      
      if (existingItem) {
        return NextResponse.json(
          { error: "QR code already exists" },
          { status: 400 }
        )
      }
    }
    
    // Create the item
    const item = await prisma.othersItem.create({
      data: {
        qr_code: qr_code || null,
        category,
        item_name,
        description: description || "",
        quantity,
        unit,
        location: location || "",
        notes: notes || "",
        availability: true,
        user_id: session.user.id,
      },
    })
    
    // Log the item creation
    await prisma.othersLog.create({
      data: {
        action: "ADDED",
        user_id: session.user.id,
        notes: `Added ${quantity} ${unit} of ${item_name} to inventory`,
      },
    })
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("Error creating other item:", error)
    return NextResponse.json(
      { error: "Failed to create other item" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    
    const { 
      id, 
      qr_code, 
      category, 
      item_name, 
      description, 
      quantity, 
      unit, 
      location, 
      notes,
      availability,
      taken_by_user_id,
      taken_at
    } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }
    
    // Check if item exists
    const existingItem = await prisma.othersItem.findUnique({
      where: { id }
    })
    
    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }
    
    // If changing QR code, check if new QR code already exists on another item
    if (qr_code && qr_code !== existingItem.qr_code) {
      const qrCodeExists = await prisma.othersItem.findFirst({
        where: { 
          qr_code,
          id: { not: id }
        }
      })
      
      if (qrCodeExists) {
        return NextResponse.json(
          { error: "QR code already exists on another item" },
          { status: 400 }
        )
      }
    }
    
    // Prepare data for update
    const updateData: any = {}
    
    if (qr_code !== undefined) updateData.qr_code = qr_code
    if (category) updateData.category = category
    if (item_name) updateData.item_name = item_name
    if (description !== undefined) updateData.description = description
    if (quantity) updateData.quantity = quantity
    if (unit) updateData.unit = unit
    if (location !== undefined) updateData.location = location
    if (notes !== undefined) updateData.notes = notes
    if (availability !== undefined) updateData.availability = availability
    if (taken_by_user_id !== undefined) updateData.taken_by_user_id = taken_by_user_id
    if (taken_at !== undefined) updateData.taken_at = taken_at
    
    // Update the item
    const updatedItem = await prisma.othersItem.update({
      where: { id },
      data: updateData,
    })
    
    // Log the update
    let logAction = "UPDATED"
    let logNotes = `Updated ${updatedItem.item_name} in inventory`
    
    // If availability changed, log accordingly
    if (availability !== undefined && availability !== existingItem.availability) {
      if (availability) {
        logAction = "RESTOCKED"
        logNotes = `Restocked ${updatedItem.item_name} in inventory`
      } else {
        logAction = "USED"
        logNotes = `Marked ${updatedItem.item_name} as used`
      }
    }
    
    await prisma.othersLog.create({
      data: {
        action: logAction,
        user_id: session.user.id,
        notes: logNotes,
      },
    })
    
    return NextResponse.json({ item: updatedItem }, { status: 200 })
  } catch (error) {
    console.error("Error updating other item:", error)
    return NextResponse.json(
      { error: "Failed to update other item" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }
    
    // Check if item exists
    const existingItem = await prisma.othersItem.findUnique({
      where: { id }
    })
    
    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }
    
    // Delete the item
    await prisma.othersItem.delete({
      where: { id },
    })
    
    // Log the deletion
    await prisma.othersLog.create({
      data: {
        action: "DELETED",
        user_id: session.user.id,
        notes: `Deleted ${existingItem.item_name} from inventory`,
      },
    })
    
    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting other item:", error)
    return NextResponse.json(
      { error: "Failed to delete other item" },
      { status: 500 }
    )
  }
} 