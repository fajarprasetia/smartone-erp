import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to serialize data, handling BigInt values
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    })
  )
}

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        spk: true,
        customer: {
          select: {
            id: true,
            nama: true,
            telp: true
          }
        },
        cutting_bagus: true,
        cutting_reject: true,
        catatan_cutting: true,
        cutting_done: true,
        status: true,
        statusm: true,
        cutting: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Serialize the order data before returning
    const serializedOrder = serializeData(order)
    return NextResponse.json(serializedOrder)

  } catch (error) {
    console.error("Error fetching cutting details:", error)
    return NextResponse.json(
      { error: "Failed to fetch cutting details" },
      { status: 500 }
    )
  }
}