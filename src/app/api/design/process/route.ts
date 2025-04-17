import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validating request body
const processDesignSchema = z.object({
  orderId: z.string().nonempty("Order ID is required"),
  designerId: z.string().nonempty("Designer ID is required"),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validation = processDesignSchema.safeParse(body);
    
    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.errors }),
        { status: 400 }
      );
    }
    
    const { orderId, designerId } = validation.data;
    
    // Check if the order exists and has statusm = "DESIGN"
    const existingOrder = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });
    
    if (!existingOrder) {
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404 }
      );
    }
    
    if (existingOrder.statusm !== "DESIGN") {
      return new NextResponse(
        JSON.stringify({ error: "Order is not in design stage" }),
        { status: 400 }
      );
    }
    
    // Update the order with the designer ID
    const updatedOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        designer_id: designerId,
      },
    });
    
    return new NextResponse(
      JSON.stringify({ 
        message: "Order assigned to designer successfully",
        order: updatedOrder
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error processing design order:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to process design order" }),
      { status: 500 }
    );
  }
} 