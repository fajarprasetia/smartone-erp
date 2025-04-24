import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log("Creating test asset");
    
    const asset = await prisma.asset.create({
      data: {
        name: "Test Asset",
        type: "Test Type",
        model: "Test Model",
        serialNumber: "TEST123",
        purchaseDate: new Date(),
        purchasePrice: "100",
        location: "Test Location",
        status: "Active",
        notes: "This is a test asset created via API",
      }
    });
    
    console.log("Test asset created:", asset);
    
    return NextResponse.json(
      { success: true, asset },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating test asset:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create test asset", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 