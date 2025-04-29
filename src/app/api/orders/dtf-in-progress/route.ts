import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all orders with status = 'DTF' (in progress)
    const orders = await db.order.findMany({
      where: {
        status: "DTF",
      },
      select: {
        id: true,
        spk: true,
        customer: {
          select: {
            nama: true,
          },
        },
        produk: true,
        status: true,
        prioritas: true,
        created_at: true,
        est_order: true,
        tgl_dtf: true,
      },

      orderBy: [
        // Sort by priority (high to low)
        { prioritas: "asc" },
        // Then by DTF start time (newest first)
        { tgl_dtf: "desc" },
      ],
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching DTF in progress orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch DTF in progress orders" },
      { status: 500 }
    );
  }
} 