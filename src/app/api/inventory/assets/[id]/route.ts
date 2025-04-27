import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request
) {
  try {
    // Validate session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the asset ID from the URL
    const url = new URL(request.url)
    const assetId = url.pathname.split('/')[4] // /api/inventory/assets/[id]

    // Fetch asset and maintenance records
    const [asset, maintenanceRecords] = await Promise.all([
      prisma.asset.findUnique({
        where: { id: assetId }
      }),
      prisma.assetMaintenanceRecord.findMany({
        where: { assetId },
        orderBy: { date: "desc" }
      })
    ])

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      asset,
      maintenanceRecords
    })
  } catch (error) {
    console.error("Error fetching asset:", error)
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    )
  }
} 