import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Simple response without any dependencies
    return NextResponse.json({
      status: "connected",
      message: "Simple test endpoint is working",
    })
  } catch (error) {
    console.error("Simple test error:", error)
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
} 