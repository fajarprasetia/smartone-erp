import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the order with DTF-related fields
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        spk: true,
        produk: true,
        printd_mesin: true,
        catatan_print: true,
        printd_icc: true,
        pet: true,
        suhu_meja: true,
        printd_speed: true,
        white_setting: true,
        choke: true,
        white_precentage: true,
        total_pet: true,
        tgl_dtf: true,
        dtf_done: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching DTF details:", error);
    return NextResponse.json(
      { message: "Failed to fetch DTF details" },
      { status: 500 }
    );
  }
} 