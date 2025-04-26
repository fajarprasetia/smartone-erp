import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { existsSync } from "fs";

// Use the proper Route Segment Config format for Next.js 14
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get form data from request
    const formData = await req.formData();
    
    // Check for folder parameter in URL
    const url = new URL(req.url);
    const folderParam = url.searchParams.get('folder');
    const useFolder = folderParam === 'tfuploads' ? 'tfuploads' : 'uploads';
    
    // Define upload path and URL prefix
    let uploadDir = join(process.cwd(), "public", useFolder);
    let urlPrefix = `/${useFolder}`; // URL prefix based on folder name
    
    // Ensure the uploads directory exists
    if (!existsSync(uploadDir)) {
      console.log(`Creating upload directory: ${uploadDir}`);
      try {
        await mkdir(uploadDir, { recursive: true });
        
        // Verify directory was created
        if (!existsSync(uploadDir)) {
          console.error("Failed to verify uploads directory exists after creation");
          return new NextResponse(
            JSON.stringify({ 
              error: "Failed to create uploads directory", 
              details: "Directory creation succeeded but verification failed" 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (mkdirError) {
        console.error("Error creating uploads directory:", mkdirError);
        
        // Try to use a fallback directory at the root level
        const fallbackDir = join(process.cwd(), useFolder);
        try {
          console.log(`Attempting to use fallback directory: ${fallbackDir}`);
          await mkdir(fallbackDir, { recursive: true });
          
          // If successful, use this directory instead
          if (existsSync(fallbackDir)) {
            console.log(`Using fallback uploads directory: ${fallbackDir}`);
            uploadDir = fallbackDir;
            urlPrefix = ""; // Update URL prefix for fallback directory
          } else {
            return new NextResponse(
              JSON.stringify({ 
                error: "Failed to create uploads directory", 
                details: (mkdirError as Error).message 
              }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } catch (fallbackError) {
          console.error("Error creating fallback directory:", fallbackError);
          return new NextResponse(
            JSON.stringify({ 
              error: "Failed to create uploads directory", 
              details: (mkdirError as Error).message,
              fallbackError: (fallbackError as Error).message
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    // Process capture file
    const captureFile = (formData as any).get("capture") as File | null;
    let captureUrl: string | undefined;
    
    if (captureFile) {
      try {
        console.log(`Processing capture file: ${captureFile.name}, size: ${captureFile.size}`);
        // Generate unique filename to prevent overwriting
        const fileExtension = captureFile.name.split(".").pop() || 'jpg';
        const fileName = `design_${uuidv4()}.${fileExtension}`;
        
        // Get file bytes
        const bytes = await captureFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const filePath = join(uploadDir, fileName);
        console.log(`Writing capture file to: ${filePath}`);
        
        // Write file to disk
        try {
          await writeFile(filePath, buffer);
          
          // Verify file was written
          if (!existsSync(filePath)) {
            throw new Error(`File verification failed: ${filePath} does not exist after write operation`);
          }
          
          // Set URL for the uploaded file
          captureUrl = `${urlPrefix}/${fileName}`;
          console.log(`Capture URL set to: ${captureUrl}`);
        } catch (writeError) {
          console.error(`Error writing file to disk: ${filePath}`, writeError);
          throw new Error(`Failed to write file to disk: ${(writeError as Error).message}`);
        }
        
      } catch (error) {
        console.error("Error handling capture file upload:", error);
        return new NextResponse(
          JSON.stringify({ error: "Failed to upload capture file", details: (error as Error).message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Process capture name file
    const captureNameFile = (formData as any).get("captureName") as File | null;
    let captureNameUrl: string | undefined;
    
    if (captureNameFile) {
      try {
        console.log(`Processing capture name file: ${captureNameFile.name}, size: ${captureNameFile.size}`);
        // Generate unique filename
        const fileExtension = captureNameFile.name.split(".").pop() || 'jpg';
        const fileName = `name_${uuidv4()}.${fileExtension}`;
        
        // Get file bytes
        const bytes = await captureNameFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const filePath = join(uploadDir, fileName);
        console.log(`Writing capture name file to: ${filePath}`);
        
        // Write file to disk
        try {
          await writeFile(filePath, buffer);
          
          // Verify file was written
          if (!existsSync(filePath)) {
            throw new Error(`File verification failed: ${filePath} does not exist after write operation`);
          }
          
          // Set URL for the uploaded file
          captureNameUrl = `${urlPrefix}/${fileName}`;
          console.log(`Capture name URL set to: ${captureNameUrl}`);
        } catch (writeError) {
          console.error(`Error writing file to disk: ${filePath}`, writeError);
          throw new Error(`Failed to write file to disk: ${(writeError as Error).message}`);
        }
        
      } catch (error) {
        console.error("Error handling capture name file upload:", error);
        return new NextResponse(
          JSON.stringify({ error: "Failed to upload capture name file", details: (error as Error).message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Process generic file (for payment receipts, etc.)
    const genericFile = (formData as any).get("file") as File | null;
    let path: string | undefined;
    
    if (genericFile) {
      try {
        console.log(`Processing generic file: ${genericFile.name}, size: ${genericFile.size}`);
        // Generate unique filename
        const fileExtension = genericFile.name.split(".").pop() || 'jpg';
        const fileName = `receipt_${uuidv4()}.${fileExtension}`;
        
        // Get file bytes
        const bytes = await genericFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const filePath = join(uploadDir, fileName);
        console.log(`Writing generic file to: ${filePath}`);
        
        // Write file to disk
        try {
          await writeFile(filePath, buffer);
          
          // Verify file was written
          if (!existsSync(filePath)) {
            throw new Error(`File verification failed: ${filePath} does not exist after write operation`);
          }
          
          // Set path for the uploaded file
          path = `${urlPrefix}/${fileName}`;
          console.log(`Generic file path set to: ${path}`);
        } catch (writeError) {
          console.error(`Error writing file to disk: ${filePath}`, writeError);
          throw new Error(`Failed to write file to disk: ${(writeError as Error).message}`);
        }
        
      } catch (error) {
        console.error("Error handling generic file upload:", error);
        return new NextResponse(
          JSON.stringify({ error: "Failed to upload file", details: (error as Error).message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Return URLs of the uploaded files
    return new NextResponse(
      JSON.stringify({
        message: "Files uploaded successfully",
        captureUrl,
        captureNameUrl,
        path, // Include the generic file path
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error processing file upload:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to process file upload", 
        details: (error as Error).message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 