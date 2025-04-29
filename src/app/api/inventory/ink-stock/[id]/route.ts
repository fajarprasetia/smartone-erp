import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const inkStock = await db.inkStock.findUnique({
      where: { id },
    })

    if (!inkStock) {
      return NextResponse.json(
        { error: "Ink stock not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(inkStock)
  } catch (error) {
    console.error("[INK_STOCK_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { id } = params

    // Validate required fields
    if (!body.barcode_id || !body.type || !body.color || !body.quantity || !body.unit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update the ink stock
    const updatedInk = await db.inkStock.update({
      where: { id },
      data: {
        barcode_id: body.barcode_id,
        supplier: body.supplier || null,
        type: body.type,
        color: body.color,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        notes: body.notes || null,
        dateUpdated: new Date(),
      },
    })

    return NextResponse.json(updatedInk)
  } catch (error) {
    console.error("[INK_STOCK_PUT]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 