import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pettyCashRecords = await prisma.pettyCash.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        },
        account: true
      }
    })

    return NextResponse.json(pettyCashRecords)
  } catch (error) {
    console.error("Error fetching petty cash records:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { amount, type, description, date, accountId } = data

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const pettyCash = await prisma.pettyCash.create({
      data: {
        amount,
        type,
        description,
        date: new Date(date),
        accountId,
        userId: session.user.id
      }
    })

    return NextResponse.json(pettyCash)
  } catch (error) {
    console.error("Error creating petty cash record:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 