import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for account creation
const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

// Validation schema for account update
const updateAccountSchema = createAccountSchema.partial()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accounts = await prisma.vendorAccount.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        description: true,
        parentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAccountSchema.parse(body)

    const account = await prisma.vendorAccount.create({
      data: {
        ...validatedData,
        status: "ACTIVE"
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error creating account:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateAccountSchema.parse(body)

    const account = await prisma.vendorAccount.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error updating account:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const account = await prisma.vendorAccount.update({
      where: { id },
      data: { status: "INACTIVE" }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error deactivating account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 