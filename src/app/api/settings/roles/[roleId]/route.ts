import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1),
  isAdmin: z.boolean().optional(),
})

export async function GET(
  req: Request,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const role = await db.role.findUnique({
      where: {
        id: params.roleId,
      },
      include: {
        permissions: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)
    const { name, description, permissionIds } = validatedData

    // Check if role exists and is not a system role
    const existingRole = await db.role.findUnique({
      where: { id: params.roleId },
      include: { permissions: true }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      )
    }

    if (existingRole.name === "System Administrator" || existingRole.name === "Administrator") {
      return NextResponse.json(
        { error: "Cannot modify system roles" },
        { status: 403 }
      )
    }

    const updatedRole = await db.role.update({
      where: {
        id: params.roleId,
      },
      data: {
        name,
        description,
        permissions: {
          set: permissionIds.map(id => ({ id })),
        },
      },
      include: {
        permissions: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("Error updating role:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const role = await db.role.findUnique({
      where: {
        id: params.roleId,
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      )
    }

    if (role.name === "System Administrator" || role.name === "Administrator") {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 403 }
      )
    }

    await db.role.delete({
      where: {
        id: params.roleId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 