import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1),
  isAdmin: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    if (!currentUser?.role?.isAdmin && !currentUser?.role?.isSystem) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if role exists
    const roleToUpdate = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
      },
    })

    if (!roleToUpdate) {
      return new NextResponse("Role not found", { status: 404 })
    }

    // Prevent editing system roles
    if (roleToUpdate.isSystem) {
      return new NextResponse(
        "System roles cannot be edited",
        { status: 403 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // If name is being updated, check if it already exists
    if (validatedData.name && validatedData.name !== roleToUpdate.name) {
      const existingRole = await prisma.role.findUnique({
        where: {
          name: validatedData.name,
        },
      })

      if (existingRole) {
        return new NextResponse("Role name already exists", { status: 400 })
      }
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isAdmin: validatedData.isAdmin,
        permissions: {
          // First disconnect all existing permissions
          disconnect: roleToUpdate.permissions?.map(permission => ({ id: permission.id })) || [],
          // Then connect the new permissions
          connect: validatedData.permissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("[ROLE_UPDATE]", error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new NextResponse(
      `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    if (!currentUser?.role?.isAdmin && !currentUser?.role?.isSystem) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if role exists
    const roleToDelete = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!roleToDelete) {
      return new NextResponse("Role not found", { status: 404 })
    }

    // Prevent deleting system roles
    if (roleToDelete.isSystem) {
      return new NextResponse(
        "System roles cannot be deleted",
        { status: 403 }
      )
    }

    // Prevent deleting roles with users
    if (roleToDelete._count.users > 0) {
      return new NextResponse(
        "Cannot delete role with assigned users",
        { status: 400 }
      )
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ROLE_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 