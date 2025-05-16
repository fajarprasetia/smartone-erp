import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1),
  isAdmin: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("Session:", JSON.stringify(session, null, 2))

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })
    console.log("Current user:", JSON.stringify(currentUser, null, 2))

    if (!currentUser?.role?.isAdmin && !currentUser?.role?.isSystem) {
      console.log("User role is not admin or system. Role:", currentUser?.role)
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    console.log("Request body:", body)
    
    const validatedData = roleSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: {
        name: validatedData.name,
      },
    })

    if (existingRole) {
      return new NextResponse("Role name already exists", { status: 400 })
    }

    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isAdmin: validatedData.isAdmin,
        permissions: {
          connect: validatedData.permissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    })

    return NextResponse.json(role)
  } catch (error) {
    console.error("[ROLES_POST] Detailed error:", error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
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

    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("[ROLES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 