import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

const bigIntSerializer = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string for serialization
  }
  
  if (data instanceof Date) {
    return data.toISOString(); // Properly format Date objects
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

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch orders with "DTF READY" status and include customer information
    const orders = await db.order.findMany({
      where: {
        status: "DTF READY"
      },
      orderBy: [
        { prioritas: "desc" },
        { created_at: "asc" }
      ]
    });

    console.log(`Found ${orders.length} orders with DTF READY status`);

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No DTF READY orders found",
        data: []
      });
    }

    return NextResponse.json({
      success: true,
      message: "DTF READY orders fetched successfully",
      data: orders
    });

  } catch (error) {
    console.error("Error fetching DTF READY orders:", error);
    return NextResponse.json({ 
      error: "Failed to fetch DTF READY orders",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please login" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch orders with "DTF READY" status and include customer information
    const orders = await db.order.findMany({
      where: {
        status: "DTF READY"
      },
      include: {
        customer: true,
      },
      orderBy: [
        { prioritas: "desc" },
        { created_at: "asc" }
      ]
    });

    console.log(`Found ${orders.length} orders with DTF READY status`);

    // Return array directly as expected by the frontend component
    return NextResponse.json(bigIntSerializer(orders));

  } catch (error) {
    console.error("Error fetching DTF READY orders:", error);
    return NextResponse.json({ 
      error: "Failed to fetch DTF READY orders",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 