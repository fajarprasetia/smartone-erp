import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// Vendor schema for validation
const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  taxId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: "ACTIVE"
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = vendorSchema.parse(body)

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        status: "ACTIVE"
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating vendor:", error)
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    )
  }
} 