import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const bigIntSerializer = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => bigIntSerializer(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = bigIntSerializer(data[key]);
      }
    }
    return result;
  }
  
  return data;
};

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

    // Fetch all orders with status = 'PRESS' (ready for DTF)
    const orders = await db.order.findMany({
      where: {
        produk: "DTF",
        status: "READYFORPROD",
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
        updated_at: true,
        est_order: true,
      },
      orderBy: [
        // Sort by priority (high to low)
        { prioritas: "asc" },
        // Then by creation date (newest first)
        { created_at: "desc" },
      ],
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching pending DTF orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending DTF orders" },
      { status: 500 }
    );
  }
} 