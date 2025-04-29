import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ 
    status: "connected",
    message: "Test API is working" 
  })
} 