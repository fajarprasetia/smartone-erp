"use server"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Handler for GET requests - fetch ink stocks
export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const availability = searchParams.get("availability")
    const inkType = searchParams.get("type")
    const color = searchParams.get("color")
    
    // Build filters object for the database query
    const filters: any = {}
    
    if (availability) {
      filters.availability = availability
    }
    
    if (inkType) {
      filters.type = inkType
    }
    
    if (color) {
      filters.color = color
    }
    
    console.log("Fetching ink stocks with filters:", filters);
    
    try {
      // Query database for ink stocks
      const inkStocks = await prisma.inkStock.findMany({
        where: filters,
        include: {
          addedByUser: true
        }
      })
      
      console.log("Found ink stocks:", inkStocks.length);
      
      // Format the response data to match the frontend InkStock interface
      const formattedInkStocks = inkStocks.map(stock => ({
        id: stock.id,
        barcode_id: stock.barcode_id,
        supplier: stock.supplier || "",
        type: stock.type,
        color: stock.color,
        quantity: stock.quantity,
        unit: stock.unit,
        date_added: stock.dateAdded.toISOString(),
        added_by: stock.added_by,
        notes: stock.notes || "",
        availability: stock.availability,
        user_name: stock.addedByUser?.name || "Unknown"
      }))
      
      return NextResponse.json(formattedInkStocks)
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${(dbError as Error).message}`);
    }
  } catch (error) {
    console.error("Error fetching ink stocks:", error)
    return NextResponse.json(
      { error: "Failed to fetch ink stocks", details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Handler for POST requests - add new ink stock
export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request body
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ["barcode_id", "ink_type", "color", "quantity", "unit"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Parse float for quantity
    const quantity = parseFloat(data.quantity);
    
    try {
      // Format data for database insertion
      const newInkStock = await prisma.inkStock.create({
        data: {
          barcode_id: data.barcode_id,
          name: data.name || `${data.color} ${data.ink_type}`,
          supplier: data.supplier || null,
          type: data.ink_type,
          color: data.color,
          quantity: quantity,
          unit: data.unit,
          notes: data.notes || null,
          added_by: session.user.id,
          availability: "YES"
        }
      })
      
      console.log("Created ink stock:", newInkStock);
      
      // Log the activity
      try {
        await fetch(`${request.nextUrl.origin}/api/activity/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ADD_INK_STOCK",
            description: `Added ${data.color} ${data.ink_type} ink (${data.quantity} ${data.unit})`,
            user_id: session.user.id,
            module: "inventory",
            entity_id: newInkStock.id,
            entity_type: "ink_stocks"
          }),
        })
      } catch (logError) {
        console.error("Failed to log activity:", logError)
        // Continue execution even if logging fails
      }
      
      return NextResponse.json({
        message: "Ink stock added successfully",
        data: newInkStock
      })
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${(dbError as Error).message}`);
    }
  } catch (error) {
    console.error("Error adding ink stock:", error)
    return NextResponse.json(
      { error: "Failed to add ink stock", details: (error as Error).message },
      { status: 500 }
    )
  }
} 