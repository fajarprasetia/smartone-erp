import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST /api/user/reset-password - Reset user password
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { currentPassword, newPassword } = await req.json()
    
    // Get user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or password not set" },
        { status: 404 }
      )
    }
    
    // Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.password)
    
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update user password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    })
    
    return NextResponse.json({
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
} 