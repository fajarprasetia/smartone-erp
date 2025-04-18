import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { bigIntSerializer } from "@/lib/utils";

// Schema for validating request body
const updateOrderStatusSchema = z.object({
  statusm: z.string().optional(),
  status: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get order ID from params
    const orderId = params.id;
    
    if (!orderId) {
      return new NextResponse(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!existingOrder) {
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = updateOrderStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract status fields
    const { statusm, status } = validation.data;
    
    // Prepare update data
    const updateData: { statusm?: string; status?: string } = {};
    
    if (statusm !== undefined) {
      updateData.statusm = statusm;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    // Update the order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
    });
    
    // Serialize the data to handle BigInt values
    const serializedData = bigIntSerializer({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
    
    return new NextResponse(
      JSON.stringify(serializedData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error updating order status:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update order status" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 