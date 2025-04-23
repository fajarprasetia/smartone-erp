import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Password update endpoint that uses bcrypt for proper password hashing
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the user has admin rights
    if (!session.user.role || (session.user.role.name !== "System Administrator" && session.user.role.name !== "Administrator")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    // Properly await params.id
    const { id } = await params
    
    // Validate request body
    let newPassword;
    try {
      const body = await req.json();
      newPassword = body.newPassword;
      
      if (!newPassword || typeof newPassword !== 'string') {
        return NextResponse.json(
          { error: "New password is required" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    // Find the user to reset password
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Prevent resetting password for system administrator account
    if (user.email === "systemadministrator@smartone.id") {
      return NextResponse.json(
        { error: "Cannot reset system administrator password" }, 
        { status: 403 }
      )
    }
    
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update the user's password with the properly hashed password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })
    
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating password:", error)
    
    // Handle specific errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Password update failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    )
  }
} 