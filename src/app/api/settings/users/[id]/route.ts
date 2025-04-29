import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Schema for updating a user
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    })

    if (!currentUser || (!currentUser.role?.isAdmin && !currentUser.role?.isSystem)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if user exists
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.id },
      include: { role: true },
    })

    if (!userToUpdate) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Prevent editing the system administrator
    if (userToUpdate.email === "systemadministrator@smartone.id") {
      return new NextResponse(
        "The System Administrator account cannot be edited",
        { status: 403 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.name) {
      updateData.name = validatedData.name
    }
    
    if (validatedData.roleId) {
      updateData.roleId = validatedData.roleId
    }
    
    // Only hash and update password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        role: true,
      },
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("[USER_UPDATE]", error)
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
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    })

    if (!currentUser || (!currentUser.role?.isAdmin && !currentUser.role?.isSystem)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if user exists and is not a system administrator
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      include: { role: true },
    })

    if (!userToDelete) {
      return new NextResponse("User not found", { status: 404 })
    }

    if (userToDelete.role?.name === "System Administrator") {
      return new NextResponse(
        "Cannot delete System Administrator account",
        { status: 403 }
      )
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[USER_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}