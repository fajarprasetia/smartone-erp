import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bigIntSerializer } from "@/lib/utils";

export async function GET() {
  try {
    // Get all orders with status PRESS
    const orders = await db.order.findMany({
      where: {
        status: "PRESS",
      },
      include: {
        customer: {
          select: {
            nama: true,
          },
        },
        press: {
          select: {
            name: true,
          },
        },
        asal_bahan_rel: {
          select: {
            nama: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(bigIntSerializer(orders));
  } catch (error) {
    console.error("Failed to fetch PRESS in-progress orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch PRESS in-progress orders" },
      { status: 500 }
    );
  }
} 