import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST: Validate barcode against paper request specifications
export async function POST(req: NextRequest) {
  // Initialize data with default undefined to avoid reference errors in catch block
  let data: any;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    data = await req.json();
    
    // Validate required fields
    if (!data.barcode_id || !data.paper_type || !data.gsm || !data.width || !data.length) {
      return NextResponse.json(
        { error: "Missing required fields", details: "Barcode ID, paper type, GSM, width, and length are required" },
        { status: 400 }
      );
    }
    
    // Find the paper stock with the provided barcode
    console.log(`Looking for paper stock with QR code: ${data.barcode_id}`);
    let paperStock;
    try {
      paperStock = await prisma.paperStock.findFirst({
        where: {
          qrCode: data.barcode_id
        }
      });
      
      // Log the raw query results
      console.log('Paper stock query result:', JSON.stringify(paperStock, null, 2));
    } catch (dbError) {
      console.error('Database error when looking up paper stock:', dbError);
      console.error('Error details:', JSON.stringify(dbError, null, 2));
      
      // Add specific logging for the P2021 error (table not found)
      if (dbError && (dbError as any).code === 'P2021') {
        console.error('The table does not exist in the database. You may need to run a migration.');
        
        // Try logging all available models in Prisma
        try {
          const models = Object.keys(prisma);
          console.log('Available Prisma models:', models);
        } catch (e) {
          console.error('Failed to log available models:', e);
        }
      }
      
      return NextResponse.json(
        { error: "Database error", details: "Failed to query the database for the barcode" },
        { status: 500 }
      );
    }
    
    // If no paper stock found with this barcode
    if (!paperStock) {
      console.log(`No paper stock found with QR code: ${data.barcode_id}`);
      
      // Log all paper stocks to help with debugging
      const allStocks = await prisma.paperStock.findMany({
        take: 5, // Just get a few for diagnostics
        select: {
          id: true,
          qrCode: true,
          name: true,
          type: true
        }
      });
      
      console.log('Available paper stocks sample:', JSON.stringify(allStocks, null, 2));
      
      return NextResponse.json(
        { error: "Barcode not found in inventory", details: `No paper stock found with barcode: ${data.barcode_id}` },
        { status: 404 }
      );
    }
    
    console.log('Found paper stock:', JSON.stringify({
      id: paperStock.id,
      qrCode: paperStock.qrCode,
      name: paperStock.name,
      type: paperStock.type,
      gsm: paperStock.gsm,
      width: paperStock.width,
      length: paperStock.length,
      approved: paperStock.approved
    }, null, 2));
    
    // Define tolerance for numeric comparisons (e.g., 5% tolerance)
    const tolerance = 0.05;
    
    // Convert specifications to numbers for comparison - handle potential conversion errors
    let requestGsm, stockGsm, requestWidth, stockWidth, requestLength, stockLength;
    
    try {
      requestGsm = parseFloat(data.gsm);
      stockGsm = paperStock.gsm;
      
      if (isNaN(requestGsm)) {
        console.warn(`Invalid GSM value from request: ${data.gsm}`);
        requestGsm = 0;
      }
      
      requestWidth = parseFloat(data.width);
      stockWidth = paperStock.width;
      
      if (isNaN(requestWidth)) {
        console.warn(`Invalid width value from request: ${data.width}`);
        requestWidth = 0;
      }
      
      requestLength = parseFloat(data.length);
      stockLength = paperStock.length || 0;
      
      if (isNaN(requestLength)) {
        console.warn(`Invalid length value from request: ${data.length}`);
        requestLength = 0;
      }
      
      console.log('Converted values for comparison:', {
        requestGsm, stockGsm,
        requestWidth, stockWidth,
        requestLength, stockLength
      });
    } catch (conversionError) {
      console.error('Error converting values:', conversionError);
      return NextResponse.json(
        { error: "Error parsing numeric values", details: "Failed to convert paper specifications to numbers for comparison" },
        { status: 400 }
      );
    }
    
    // Check if specifications match within tolerance
    const gsmMatches = Math.abs(requestGsm - stockGsm) <= stockGsm * tolerance;
    const widthMatches = Math.abs(requestWidth - stockWidth) <= stockWidth * tolerance;
    const lengthMatches = stockLength === 0 || 
                          stockLength >= requestLength || 
                          Math.abs(requestLength - stockLength) <= stockLength * tolerance;
    
    // Check if paper type matches
    const paperTypeMatches = paperStock.type?.toLowerCase() === data.paper_type?.toLowerCase();
    
    // Check if the paper stock is available
    const isAvailable = paperStock.approved === true;
    
    console.log('Matching results:', {
      paperTypeMatches,
      gsmMatches,
      widthMatches,
      lengthMatches,
      isAvailable
    });
    
    // Build validation messages
    const validationMessages = [];
    
    if (!paperTypeMatches) {
      validationMessages.push(`Paper type mismatch: Requested ${data.paper_type}, found ${paperStock.type}`);
    }
    
    if (!gsmMatches) {
      validationMessages.push(`GSM mismatch: Requested ${requestGsm}, found ${stockGsm}`);
    }
    
    if (!widthMatches) {
      validationMessages.push(`Width mismatch: Requested ${requestWidth}cm, found ${stockWidth}cm`);
    }
    
    if (!lengthMatches) {
      validationMessages.push(`Length mismatch: Requested ${requestLength}cm, found ${stockLength}cm`);
    }
    
    if (!isAvailable) {
      validationMessages.push(`Paper stock not available: Status ${paperStock.approved ? "Approved" : "Not Approved"}`);
    }
    
    // Return validation result
    if (validationMessages.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          errors: validationMessages,
          stock: {
            id: paperStock.id,
            name: paperStock.name,
            type: paperStock.type,
            gsm: paperStock.gsm,
            width: paperStock.width,
            length: paperStock.length,
            remainingLength: paperStock.remainingLength || 0,
            approved: paperStock.approved
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          valid: true,
          message: "Barcode validated successfully. Paper stock matches request specifications.",
          stock: {
            id: paperStock.id,
            name: paperStock.name,
            type: paperStock.type,
            gsm: paperStock.gsm,
            width: paperStock.width,
            length: paperStock.length,
            remainingLength: paperStock.remainingLength || 0,
            approved: paperStock.approved
          }
        },
        { status: 200 }
      );
    }
    
  } catch (error) {
    console.error("Error validating barcode:", error);
    
    // Add more detailed logging to help diagnose the issue
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Log any request data that might be helpful
    console.log("Request data received:", {
      barcode_id: data?.barcode_id,
      paper_type: data?.paper_type,
      gsm: data?.gsm,
      width: data?.width,
      length: data?.length
    });
    
    return NextResponse.json(
      { error: "Error validating barcode", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 