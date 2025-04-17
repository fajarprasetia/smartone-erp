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

// POST to submit a draft order (change status from DRAFT to PENDING)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Check if order exists and is a draft
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: BigInt(orderId),
        status: "DRAFT",
      },
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Draft order not found" },
        { status: 404 }
      );
    }
    
    // Verify order has required fields before submission
    if (!existingOrder.customerId || !existingOrder.produk || !existingOrder.qty) {
      return NextResponse.json(
        { 
          error: "Order is incomplete", 
          details: "Customer, product, and quantity are required before submission" 
        },
        { status: 400 }
      );
    }
    
    // Submit the order (change status from DRAFT to PENDING)
    const submittedOrder = await prisma.order.update({
      where: {
        id: BigInt(orderId),
      },
      data: {
        status: "PENDING",
        submitted_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        customer: true,
      },
    });
    
    // Process order and include marketing information
    let marketingInfo = null;
    if (submittedOrder.marketing) {
      marketingInfo = {
        name: submittedOrder.marketing,
      };
    }
    
    const processedOrder = {
      ...submittedOrder,
      marketingInfo,
    };
    
    // Optional: Create log entry for order submission
    await prisma.orderLog.create({
      data: {
        orderId: submittedOrder.id,
        action: "SUBMITTED",
        userId: session.user.id,
        notes: "Order submitted from draft",
        created_at: new Date(),
      },
    });
    
    return NextResponse.json({
      order: serializeData(processedOrder),
      message: "Order successfully submitted for approval",
    });
    
  } catch (error) {
    console.error("Error submitting draft order:", error);
    return NextResponse.json(
      {
        error: "Failed to submit draft order",
        details: String(error),
      },
      { status: 500 }
    );
  }
} 