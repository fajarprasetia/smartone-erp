import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = {
  id: string
  recordId: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, recordId } = await params
    const body = await request.json()

    // Validate the asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    // Update the maintenance record
    const updatedRecord = await prisma.assetMaintenanceRecord.update({
      where: {
        id: recordId,
        assetId: id,
      },
      data: {
        date: body.date,
        modeltype: body.modeltype,
        description: body.description,
        cost: body.cost,
        technician: body.technician,
        notes: body.notes,
      },
    })

    // Update asset's last maintenance date
    await prisma.asset.update({
      where: { id },
      data: {
        lastMaintenanceDate: body.date,
        nextMaintenanceDate: body.nextMaintenanceDate,
      },
    })

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error("[MAINTENANCE_RECORD_UPDATE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 