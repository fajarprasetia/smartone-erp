import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Helper function to serialize BigInt values
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Convert BigInt to String during serialization
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
}

/**
 * API route for marking an order as requiring no down payment
 * POST /api/orders/payment/no-dp
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { orderId } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order to NO DP status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        biaya_tambahan: "NO DP",
        catatan_tf: "NO DP",
      },
    });

    // Serialize data to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json({
      message: "Order marked as NO DP successfully",
      order: serializedOrder,
    });
  } catch (error) {
    console.error("Error marking order as NO DP:", error);
    return NextResponse.json(
      { error: "Failed to mark order as NO DP" },
      { status: 500 }
    );
  }
}

/**
 * API route for updating NO DP status
 * PATCH /api/orders/payment/no-dp
 */
export async function PATCH(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { orderId } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order to NO DP status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        biaya_tambahan: "NO DP",
        catatan_tf: "NO DP",
      },
    });

    // Serialize data to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json({
      message: "Order marked as NO DP successfully",
      order: serializedOrder,
    });
  } catch (error) {
    console.error("Error marking order as NO DP:", error);
    return NextResponse.json(
      { error: "Failed to mark order as NO DP" },
      { status: 500 }
    );
  }
} 