import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Simple test endpoint that doesn't use bcrypt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Basic session check
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Properly await params.id
    const { id } = await params
    
    // Minimal validation
    try {
      const body = await req.json();
      const { newPassword } = body;
      
      if (!newPassword) {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }
      
      // Just checking if the user exists without actually updating anything
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true }
      })
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      
      // Return success without actually changing anything
      return NextResponse.json({
        message: "Test endpoint successful",
        user: user.id,
        passwordLength: newPassword.length
      })
      
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Test endpoint error:", error)
    
    return NextResponse.json(
      { error: "Test endpoint failed" },
      { status: 500 }
    )
  }
} 