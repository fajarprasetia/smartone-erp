import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to serialize BigInt values for JSON response
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(
      data,
      (key, value) => (typeof value === "bigint" ? value.toString() : value)
    )
  );
}

// GET a specific draft order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Find the draft order
    const order = await prisma.order.findUnique({
      where: {
        id: BigInt(id),
        status: "DRAFT",
      },
      include: {
        customer: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "Draft order not found" },
        { status: 404 }
      );
    }
    
    // Process order and include marketing information
    let marketingInfo = null;
    if (order.marketing) {
      marketingInfo = {
        name: order.marketing,
      };
    }
    
    const processedOrder = {
      ...order,
      marketingInfo,
    };
    
    return NextResponse.json({
      order: serializeData(processedOrder),
    });
    
  } catch (error) {
    console.error("Error fetching draft order:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch draft order",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// PUT to update a draft order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists and is a draft
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: BigInt(id),
        status: "DRAFT",
      },
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Draft order not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Extract fields to update
    const {
      customerId,
      produk,
      qty,
      spk,
      no_project,
      // Other fields as needed
    } = body;
    
    // Update order
    const updatedOrder = await prisma.order.update({
      where: {
        id: BigInt(id),
      },
      data: {
        customerId: customerId ? BigInt(customerId) : undefined,
        produk,
        qty,
        spk,
        no_project,
        updated_at: new Date(),
        // Add other fields as needed
      },
      include: {
        customer: true,
      },
    });
    
    // Process order and include marketing information
    let marketingInfo = null;
    if (updatedOrder.marketing) {
      marketingInfo = {
        name: updatedOrder.marketing,
      };
    }
    
    const processedOrder = {
      ...updatedOrder,
      marketingInfo,
    };
    
    return NextResponse.json({
      order: serializeData(processedOrder),
      message: "Draft order updated successfully",
    });
    
  } catch (error) {
    console.error("Error updating draft order:", error);
    return NextResponse.json(
      {
        error: "Failed to update draft order",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE to remove a draft order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists and is a draft
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: BigInt(id),
        status: "DRAFT",
      },
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Draft order not found" },
        { status: 404 }
      );
    }
    
    // Delete the draft order
    await prisma.order.delete({
      where: {
        id: BigInt(id),
      },
    });
    
    return NextResponse.json({
      message: "Draft order deleted successfully",
    });
    
  } catch (error) {
    console.error("Error deleting draft order:", error);
    return NextResponse.json(
      {
        error: "Failed to delete draft order",
        details: String(error),
      },
      { status: 500 }
    );
  }
} 