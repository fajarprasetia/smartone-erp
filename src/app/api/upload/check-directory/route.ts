import { NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET() {
  try {
    // Define upload path
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Check if directory exists
    const exists = existsSync(uploadDir);
    
    // If it doesn't exist, try to create it
    if (!exists) {
      try {
        console.log(`Creating upload directory: ${uploadDir}`);
        await mkdir(uploadDir, { recursive: true });
        
        // Verify it was created successfully
        const nowExists = existsSync(uploadDir);
        
        return NextResponse.json({ 
          exists: nowExists,
          message: nowExists ? "Directory created successfully" : "Failed to create directory"
        });
      } catch (error) {
        console.error("Error creating uploads directory:", error);
        return NextResponse.json({ 
          exists: false, 
          error: "Failed to create uploads directory",
          details: (error as Error).message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ exists: true, message: "Upload directory exists" });
  } catch (error) {
    console.error("Error checking uploads directory:", error);
    return NextResponse.json({ 
      exists: false, 
      error: "Error checking uploads directory",
      details: (error as Error).message
    }, { status: 500 });
  }
} 