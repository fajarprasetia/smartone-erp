import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch specific paper request
export async function GET(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    const paperRequest = await prisma.paperRequest.findUnique({
      where: { id },
      include: {
        paper_stock: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!paperRequest) {
      return new NextResponse(
        JSON.stringify({ error: "Paper request not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(paperRequest);
  } catch (error) {
    console.error("Error fetching paper request:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch paper request" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT: Approve or reject paper request
export async function PUT(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await req.json();
    const { action, barcode_id } = data; // action can be "APPROVE" or "REJECT"
    
    // Check if paper request exists
    const existingRequest = await prisma.paperRequest.findUnique({
      where: {
        id: params.id,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Paper request not found" },
        { status: 404 }
      );
    }
    
    // Check if paper request is already approved or rejected
    if (existingRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Paper request is already ${existingRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      // Check if barcode_id is provided
      if (!barcode_id) {
        return NextResponse.json(
          { error: "Barcode ID is required for approval" },
          { status: 400 }
        );
      }
      
      // Check if the barcode already exists on another paper stock
      const existingStock = await prisma.paperStock.findFirst({
        where: {
          qrCode: barcode_id
        }
      });
      
      if (existingStock) {
        // Check if the stock is already linked to a different request
        if (existingStock.paperRequestId && existingStock.paperRequestId !== params.id) {
          return NextResponse.json(
            { error: `Barcode ${barcode_id} is already assigned to paper stock linked with another request` },
            { status: 400 }
          );
        }
        
        // Update the existing paper stock to link to this request
        const updatedStock = await prisma.paperStock.update({
          where: {
            id: existingStock.id
          },
          data: {
            // Update the fields with the request info
            type: existingRequest.paper_type,
            gsm: parseInt(existingRequest.gsm) || 80, // Default to 80 if parsing fails
            remainingLength: parseFloat(existingRequest.length) || null,
            paperRequestId: params.id,
            updatedByUserId: userId,
            dateUpdated: new Date(),
            notes: `${existingStock.notes || ''} Updated from request by ${existingRequest.requester?.name || existingRequest.requested_by}`,
            // Mark paper as unavailable and record who took it
            availability: "NO",
            approved: true,
            dateTaken: new Date(),
            takenByUserId: existingRequest.requested_by // Set to user who requested it
          }
        });
        
        // Update the paper request status
        const updatedRequest = await prisma.paperRequest.update({
          where: {
            id: params.id,
          },
          data: {
            status: "APPROVED",
            approved_by: userId,
            updated_at: new Date(),
            paper_stock_id: updatedStock.id
          },
        });
        
        // Create a log entry for approval with existing stock
        await prisma.paperLog.create({
          data: {
            action: "APPROVED_REQUEST_EXISTING_STOCK",
            performed_by: userId,
            notes: `Approved paper request using existing stock: ${existingRequest.gsm} GSM, ${existingRequest.width}x${existingRequest.length}cm for ${existingRequest.requester?.name || 'user'}`,
            paper_stock_id: updatedStock.id,
            request_id: updatedRequest.id,
          },
        });
        
        return NextResponse.json({
          ...updatedRequest,
          paper_stock: updatedStock,
        });
      }
      
      // If no existing stock is found, create a new one
      // Convert string measurements to numbers
      const gsmValue = parseInt(existingRequest.gsm) || 80;
      const widthValue = parseFloat(existingRequest.width) || 0;
      const lengthValue = parseFloat(existingRequest.length) || 0;
      
      try {
        // Create a new paper stock based on the request
        const newPaperStock = await prisma.paperStock.create({
          data: {
            name: `${existingRequest.paper_type} ${existingRequest.gsm}gsm`,
            type: existingRequest.paper_type,
            width: widthValue,
            height: 0, // Default value
            length: lengthValue,
            gsm: gsmValue,
            remainingLength: lengthValue,
            qrCode: barcode_id,
            addedByUserId: userId,
            updatedByUserId: userId,
            dateAdded: new Date(),
            approved: true,
            notes: `Approved from request by ${existingRequest.requester?.name || existingRequest.requested_by}`,
            paperRequestId: params.id,
            // Mark paper as unavailable and record who took it
            availability: "NO",
            dateTaken: new Date(),
            takenByUserId: existingRequest.requested_by // Set to user who requested it
          }
        });
        
        // Update the paper request status
        const updatedRequest = await prisma.paperRequest.update({
          where: {
            id: params.id,
          },
          data: {
            status: "APPROVED",
            approved_by: userId,
            updated_at: new Date(),
            paper_stock_id: newPaperStock.id
          },
        });
        
        // Create a log entry for approval
        await prisma.paperLog.create({
          data: {
            action: "APPROVED_REQUEST",
            performed_by: userId,
            notes: `Approved paper request: ${existingRequest.gsm} GSM, ${existingRequest.width}x${existingRequest.length}cm for ${existingRequest.requester?.name || 'user'}`,
            paper_stock_id: newPaperStock.id,
            request_id: updatedRequest.id,
          },
        });
        
        return NextResponse.json({
          ...updatedRequest,
          paper_stock: newPaperStock,
        });
      } catch (error) {
        console.error("Error creating paper stock:", error);
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
        }
        throw error; // Re-throw to be caught by the outer catch block
      }
    } 
    else if (action === "REJECT") {
      // Update the paper request status
      const updatedRequest = await prisma.paperRequest.update({
        where: {
          id: params.id,
        },
        data: {
          status: "REJECTED",
          rejected_by: userId,
          updated_at: new Date(),
        },
      });
      
      // Create a log entry
      await prisma.paperLog.create({
        data: {
          action: "REJECTED_REQUEST",
          performed_by: userId,
          notes: `Rejected paper request: ${existingRequest.gsm} GSM, ${existingRequest.width}x${existingRequest.length}cm for ${existingRequest.requester?.name || 'user'}`,
          request_id: updatedRequest.id,
        },
      });
      
      return NextResponse.json(updatedRequest);
    }
    
    return NextResponse.json(
      { error: "Invalid action. Action must be APPROVE or REJECT." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing paper request:", error);
    // Print more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Error processing paper request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete a paper request
export async function DELETE(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    await prisma.paperRequest.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting paper request:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete paper request" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PATCH: Update a paper request (rejection)
export async function PATCH(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    const body = await req.json();

    const updatedPaperRequest = await prisma.paperRequest.update({
      where: { id },
      data: body,
      include: {
        paper_stock: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedPaperRequest);
  } catch (error) {
    console.error("Error updating paper request:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update paper request" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 