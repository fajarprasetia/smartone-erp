import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization
const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert BigInt to String to avoid serialization issues
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  }));
};

export async function POST(
  req: Request,
  params: any
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the ID from params
    const id = await params.params.id;
    const { rejection_reason, role } = await req.json();

    if (!role) {
      return NextResponse.json(
        { error: "Missing required parameter: role" },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Define the data to update based on role
    const updateData: any = {
      ...(role === "Manager" && {
        approve_mng: "REJECT",
        reject: "REJECT",
        tgl_app_manager: new Date(),
      }),
      ...(role === "Operation Manager" && {
        approval_opr: "REJECT",
        reject: "REJECT",
        tgl_app_prod: new Date(),
      }),
      // Common data for all rejections
      status: "REJECTED",
      catatan: rejection_reason 
        ? `${order.catatan ? order.catatan + "\n" : ""}Rejection Reason: ${rejection_reason}`
        : order.catatan,
      updated_at: new Date(),
    };

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
      },
    });

    // Serialize the order to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    // Add marketingInfo for consistency with other endpoints
    const processedOrder = {
      ...serializedOrder,
      marketingInfo: serializedOrder.marketing
        ? { name: serializedOrder.marketing }
        : null,
    };

    return NextResponse.json({
      message: "Order rejected successfully",
      order: processedOrder,
    });
  } catch (error) {
    console.error("Error rejecting order:", error);
    return NextResponse.json(
      {
        error: "Failed to reject order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 