import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Get pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    
    // Calculate skip value for pagination (0 for page 1, pageSize for page 2, etc.)
    const skip = (page - 1) * pageSize;
    
    // Prepare filter conditions
    const whereCondition = search
      ? {
          OR: [
            { spk: { contains: search, mode: "insensitive" } },
            { produk: { contains: search, mode: "insensitive" } },
            { customer: { nama: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    // Get total count for pagination
    const totalCount = await prisma.Order.count({
      where: whereCondition,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch orders with pagination and include customer data
    const orders = await prisma.Order.findMany({
      where: whereCondition,
      include: {
        customer: true,
      },
      skip,
      take: pageSize,
      orderBy: { tanggal: "desc" },
    });

    // Process orders to include marketing info
    const processedOrders = orders.map(order => {
      return {
        ...order,
        // Create marketingInfo object from the marketing string field
        marketingInfo: order.marketing ? { name: order.marketing } : null,
      };
    });

    return NextResponse.json(
      serializeData({
        orders: processedOrders,
        totalCount,
        totalPages,
        currentPage: page,
      })
    );
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: error.message,
        details: String(error) 
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check for required fields
    const requiredFields = ["customer_id", "tanggal", "produk", "status"];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Missing required fields",
          missingFields,
        }),
        { status: 400 }
      );
    }

    // Create new order
    const newOrder = await prisma.Order.create({
      data: {
        spk: body.spk || "",
        no_project: body.no_project || "",
        tanggal: new Date(body.tanggal),
        est_order: body.target_selesai ? new Date(body.target_selesai) : null,
        customer_id: body.customer_id,
        marketing: body.marketing || "", // Store marketing as string
        produk: body.produk,
        asal_bahan: body.asal_bahan || "",
        panjang: body.panjang || 0,
        qty: body.qty || "",
        harga_satuan: body.harga || "",
        status: body.status,
        catatan: body.catatan || "",
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        customer: true,
      },
    });

    // Process order to include marketing info for consistency with GET endpoint
    const processedOrder = {
      ...newOrder,
      marketingInfo: newOrder.marketing ? { name: newOrder.marketing } : null,
    };

    return NextResponse.json(serializeData(processedOrder));
  } catch (error: any) {
    console.error("Error creating order:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: error.message,
        details: String(error) 
      }),
      { status: 500 }
    );
  }
}