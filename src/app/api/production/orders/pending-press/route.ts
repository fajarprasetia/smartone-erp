import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bigIntSerializer } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch orders eligible for press
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] Fetching pending press orders");

    // Prepare the query to get orders that are:
    // 1. Orders with "PRESS READY" status (case-insensitive)
    // 2. Orders with "PRINT DONE" status that contain "PRESS" in their product name (case-insensitive)
    // 3. Exclude orders already in "PRESS" status
    const pendingPressOrders = await db.order.findMany({
      where: {
        OR: [
          {
            // Match "PRESS READY" status (case-insensitive)
            status: {
              mode: 'insensitive',
              equals: 'PRESS READY',
            }
          },
          {
            // Match "PRINT DONE" status with "PRESS" in product name (case-insensitive)
            AND: [
              {
                status: {
                  mode: 'insensitive',
                  equals: 'PRINT DONE',
                }
              },
              {
                produk: {
                  mode: 'insensitive',
                  contains: 'PRESS',
                }
              }
            ]
          }
        ],
        // Exclude orders already in "PRESS" status
        NOT: {
          status: {
            mode: 'insensitive',
            equals: 'PRESS',
          }
        }
      },
      select: {
        id: true,
        spk: true,
        created_at: true,
        kategori: true,
        est_order: true,
        status: true,
        statusprod: true,
        produk: true,
        nama_kain: true,
        lebar_kain: true,
        warna_acuan: true,
        tgl_print: true,
        print_done: true,
        asal_bahan_id: true,
        qty: true,
        customer: true,
        asal_bahan_rel: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designer: {
          select: {
            id: true,
            name: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log(`[API] Found ${pendingPressOrders.length} pending press orders`);

    // Serialize and return the orders
    return NextResponse.json(bigIntSerializer(pendingPressOrders));
  } catch (error: any) {
    console.error("[API] Error fetching pending press orders:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch pending press orders",
        details: error.message || "Unknown error occurred" 
      },
      { status: 500 }
    );
  }
} 