import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requestId = params.id;
    
    const inkRequest = await prisma.inkRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requester: {
          select: {
            name: true,
          },
        },
        ink_stock: true,
      },
    });
    
    if (!inkRequest) {
      return NextResponse.json(
        { error: "Ink request not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ...inkRequest,
      user_name: inkRequest.requester?.name,
    });
  } catch (error) {
    console.error("Error fetching ink request:", error);
    return NextResponse.json(
      { error: "Failed to fetch ink request" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const requestId = params.id;
    const { status, notes, ink_stock_id } = await req.json();
    
    // Get the ink request before updating
    const inkRequest = await prisma.inkRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!inkRequest) {
      return NextResponse.json(
        { error: "Ink request not found" },
        { status: 404 }
      );
    }
    
    // Handle approval logic
    if (status === "APPROVED") {
      // Check if ink_stock_id is provided for approval
      if (!ink_stock_id) {
        return NextResponse.json(
          { error: "Ink stock ID is required for approval" },
          { status: 400 }
        );
      }
      
      // Get the ink stock for validation
      const inkStock = await prisma.inkStock.findUnique({
        where: {
          id: ink_stock_id,
        },
      });
      
      if (!inkStock) {
        return NextResponse.json(
          { error: "Ink stock not found" },
          { status: 404 }
        );
      }
      
      // Check if the ink stock has sufficient quantity
      if (inkStock.quantity < inkRequest.quantity) {
        return NextResponse.json(
          { error: "Insufficient ink quantity available" },
          { status: 400 }
        );
      }
      
      // Update the ink stock quantity
      await prisma.inkStock.update({
        where: {
          id: ink_stock_id,
        },
        data: {
          quantity: {
            decrement: inkRequest.quantity,
          },
          dateUpdated: new Date(),
        },
      });
    }
    
    // Update the ink request
    const updatedRequest = await prisma.inkRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status,
        user_notes: notes,
        approved_by: status === "APPROVED" ? userId : null,
        rejected_by: status === "REJECTED" ? userId : null,
        ink_stock_id: status === "APPROVED" ? ink_stock_id : null,
        updated_at: new Date(),
      },
      include: {
        requester: {
          select: {
            name: true,
          },
        },
        ink_stock: true,
      },
    });
    
    // Create a log entry for the action
    const action = status === "APPROVED" ? "APPROVED" : "REJECTED";
    let logNotes = '';
    
    if (status === "APPROVED") {
      logNotes = `Approved request for ${inkRequest.quantity} ${inkRequest.unit} of ${inkRequest.color} ${inkRequest.ink_type} ink. ${notes || ''}`;
    } else {
      logNotes = `Rejected request for ${inkRequest.quantity} ${inkRequest.unit} of ${inkRequest.color} ${inkRequest.ink_type} ink. ${notes || ''}`;
    }
    
    await prisma.inkLog.create({
      data: {
        action,
        performed_by: userId,
        request_id: requestId,
        notes: logNotes,
      },
    });
    
    return NextResponse.json({
      ...updatedRequest,
      user_name: updatedRequest.requester?.name,
    });
  } catch (error) {
    console.error("Error updating ink request:", error);
    return NextResponse.json(
      { error: "Failed to update ink request" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const requestId = params.id;
    
    // Find the ink request
    const inkRequest = await prisma.inkRequest.findUnique({
      where: {
        id: requestId,
      },
    });
    
    if (!inkRequest) {
      return NextResponse.json(
        { error: "Ink request not found" },
        { status: 404 }
      );
    }
    
    // Check if request is already approved
    if (inkRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot cancel an approved request" },
        { status: 400 }
      );
    }
    
    // Delete the ink request
    await prisma.inkRequest.delete({
      where: {
        id: requestId,
      },
    });
    
    // Log the activity
    await prisma.inkLog.create({
      data: {
        action: "CANCEL",
        performed_by: userId,
        notes: `Cancelled request for ${inkRequest.quantity} ${inkRequest.unit} of ${inkRequest.color} ${inkRequest.ink_type} ink`,
        created_at: new Date(),
      },
    });
    
    return NextResponse.json(
      { message: "Ink request cancelled successfully" }
    );
  } catch (error) {
    console.error("Error cancelling ink request:", error);
    return NextResponse.json(
      { error: "Failed to cancel ink request" },
      { status: 500 }
    );
  }
} 