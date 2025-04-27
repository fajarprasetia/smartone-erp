import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"

interface MaintenanceRecordInput {
  date: string
  modeltype: string
  description: string
  cost: string
  technician: string
  notes?: string
  nextMaintenanceDate?: string
}

export async function GET(
  request: Request
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the asset ID from the URL
    const url = new URL(request.url)
    const assetId = url.pathname.split('/')[4] // /api/inventory/assets/[id]/maintenance

    const records = await prisma.assetMaintenanceRecord.findMany({
      where: {
        assetId,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching maintenance records:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the asset ID from the URL
    const url = new URL(request.url)
    const assetId = url.pathname.split('/')[4] // /api/inventory/assets/[id]/maintenance

    const data = await request.json() as MaintenanceRecordInput

    const record = await prisma.assetMaintenanceRecord.create({
      data: {
        assetId,
        date: new Date(data.date),
        modeltype: data.modeltype,
        description: data.description,
        cost: parseFloat(data.cost),
        technician: data.technician,
        notes: data.notes || null,
      } as unknown as Prisma.AssetMaintenanceRecordUncheckedCreateInput,
    })

    // Update the asset's last maintenance date
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        lastMaintenanceDate: new Date(data.date),
        nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Error creating maintenance record:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 