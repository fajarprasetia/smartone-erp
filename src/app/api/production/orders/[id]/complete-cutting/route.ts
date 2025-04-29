import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validating the cutting completion data
const cuttingCompleteSchema = z.object({
  cutting_bagus: z.string().optional(),
  cutting_reject: z.string().optional(),
  catatan_cutting: z.string().optional(),
  cutting_mesin: z.string().optional(),
  cutting_speed: z.string().optional(),
  acc: z.string().optional(),
  power: z.string().optional(),
  cutting_done: z.string().optional(),
  status: z.string().optional(),
});

// Helper function to serialize data, handling BigInt values
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Convert BigInt to String
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    })
  );
}

export async function PATCH(
  request: Request,
  { params }: any
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to complete the cutting process" },
        { status: 401 }
      );
    }

    // Get the order ID from the route params
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    console.log("Received request body:", body);
    
    const validatedData = cuttingCompleteSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    // Find the order to update
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update the order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        cutting_done: new Date(),
        statusprod: 'CUTTING_COMPLETED',
        catatan_cutting: data.catatan_cutting || null,
        cutting_bagus: data.cutting_bagus || null,
        cutting_reject: data.cutting_reject || null,
        cutting_mesin: data.cutting_mesin || null,
        cutting_speed: data.cutting_speed || null,
        acc: data.acc || null,
        power: data.power || null
      },
      include: {
        cutting: true
      }
    });

    // Create order log
    await db.orderLog.create({
      data: {
        orderId: orderId,
        userId: session.user.id,
        action: 'CUTTING_COMPLETED',
        notes: `Cutting completed. Good: ${data.cutting_bagus}, Reject: ${data.cutting_reject}${data.catatan_cutting ? ` - Notes: ${data.catatan_cutting}` : ''}`
      }
    });

    // Serialize the response to handle BigInt values
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json(
      { message: "Cutting completed successfully", order: serializedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing cutting process:", error);
    return NextResponse.json(
      { error: "Failed to complete cutting process", details: String(error) },
      { status: 500 }
    );
  }
} 