import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching repeat orders for customer ID: ${customerId}`);

    // Try a simpler approach with Prisma
    const orders = await prisma.$queryRaw`
      SELECT o.spk, o.tanggal AS "orderDate", 
        CONCAT(
          'Customer: ', c.nama, 
          CASE WHEN o.tipe_produk IS NOT NULL THEN CONCAT(', Products: ', o.tipe_produk) ELSE '' END,
          CASE WHEN o.nama_kain IS NOT NULL THEN CONCAT(', Fabric: ', o.nama_kain) ELSE '' END,
          CASE WHEN o.jumlah_kain IS NOT NULL THEN CONCAT(', Quantity: ', o.jumlah_kain, 'm') ELSE '' END
        ) AS details
      FROM orders o
      LEFT JOIN customer c ON o.customer_id = c.id
      WHERE o.customer_id = ${customerId}::bigint
      ORDER BY o.tanggal DESC
      LIMIT 10
    `;

    console.log(`Found ${Array.isArray(orders) ? orders.length : 0} repeat orders`);
    
    return NextResponse.json(Array.isArray(orders) ? orders : []);
  } catch (error) {
    console.error("Error fetching repeat orders:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch repeat orders",
        details: error instanceof Error ? error.message : String(error),
        message: "There was an error retrieving past orders. Please try again or contact support." 
      },
      { status: 500 }
    );
  }
} 