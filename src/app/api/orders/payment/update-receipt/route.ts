import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { orderId, receiptType, receiptPath } = body;
    
    if (!orderId || !receiptType || !receiptPath) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, receiptType, and receiptPath are required" },
        { status: 400 }
      );
    }
    
    // Validate receipt type
    if (receiptType !== 'dp' && receiptType !== 'settlement') {
      return NextResponse.json(
        { error: "Invalid receipt type. Must be 'dp' or 'settlement'" },
        { status: 400 }
      );
    }
    
    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Update the appropriate receipt field
    if (receiptType === 'dp') {
      await prisma.order.update({
        where: { id: orderId },
        data: { tf_dp: receiptPath }
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { tf_pelunasan: receiptPath }
      });
    }
    
    return NextResponse.json(
      { 
        success: true,
        message: `${receiptType === 'dp' ? 'Down payment' : 'Settlement'} receipt updated successfully`
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error updating receipt:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to update receipt",
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 