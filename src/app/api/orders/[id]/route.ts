import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for order update validation
const orderUpdateSchema = z.object({
  spk: z.string().optional(),
  no_project: z.string().optional(),
  tanggal: z.date().optional(),
  target_selesai: z.date().optional(),
  customer_id: z.coerce.number(),
  marketing: z.string().optional(),
  produk: z.string().min(1, { message: "Product is required" }),
  asal_bahan: z.string().optional(),
  panjang: z.coerce.number().optional(),
  qty: z.string().optional(),
  harga: z.string().optional(),
  status: z.string(),
  catatan: z.string().optional(),
});

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET: Fetch single order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = await params.id;
    console.log(`Fetching order with ID: ${orderId}`);

    // Simple check to verify DB connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("Database connection is working");
    } catch (dbConnectionError) {
      console.error("Database connection issue:", dbConnectionError);
      return new NextResponse(
        JSON.stringify({ error: "Database connection issue" }),
        { status: 500 }
      );
    }

    // Try with raw query first to debug schema issues
    try {
      // Note the capitalized "Order" table name
      const rawOrder = await prisma.$queryRaw`
        SELECT * FROM "Order" WHERE id = ${orderId} LIMIT 1
      `;
      
      console.log("Raw order query result:", JSON.stringify(rawOrder, null, 2));
      
      // If raw query succeeds but returns empty array
      if (Array.isArray(rawOrder) && rawOrder.length === 0) {
        console.log("Order not found in database");
        return new NextResponse(
          JSON.stringify({ error: "Order not found" }),
          { status: 404 }
        );
      }
    } catch (rawQueryError) {
      console.error("Raw query error:", rawQueryError);
      // Continue execution, as this is just for debugging
    }

    // Fetch the order by ID with proper error handling
    let order;
    try {
      // Use capitalized "Order" to match your Prisma schema
      order = await prisma.Order.findUnique({
        where: { id: orderId },
        include: {
          customer: true
        },
      });
    } catch (prismaError: any) {
      console.error("Prisma error details:", prismaError);
      
      // Check for common Prisma errors
      if (prismaError.message?.includes("Unknown field")) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Database schema error", 
            details: prismaError.message,
            suggestion: "The database schema might be different than what the code expects"
          }),
          { status: 500 }
        );
      }
      
      throw prismaError; // Rethrow for the outer catch block
    }

    if (!order) {
      console.log("Order not found:", orderId);
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404 }
      );
    }

    console.log("Order found:", order.id);

    // Process the marketing field which is a string, not a relation
    const processedOrder = {
      ...order,
      marketingInfo: order.marketing ? { name: order.marketing } : null
    };

    return NextResponse.json(serializeData(processedOrder));
  } catch (error: any) {
    console.error("Error fetching order:", error);
    console.error("Error stack:", error.stack);
    
    // Return more detailed error info
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        details: String(error) 
      }),
      { status: 500 }
    );
  }
}

// PUT: Update order by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = await params.id;
    const body = await req.json();

    // Validate input
    const validationResult = orderUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.format(),
        }),
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if order exists
    const existingOrder = await prisma.Order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404 }
      );
    }

    // Check if customer exists
    let customerExists = false;
    if (validatedData.customer_id) {
      const customer = await prisma.Customer.findFirst({
        where: { 
          OR: [
            { id: String(validatedData.customer_id) }, // Try as string ID
            { id: { equals: validatedData.customer_id.toString() } } // Try another approach
          ]
        }
      });
      
      customerExists = !!customer;
    }

    if (!customerExists) {
      return new NextResponse(
        JSON.stringify({ error: "Customer not found" }),
        { status: 400 }
      );
    }

    // Update the order - note that marketing is a string field, not a relation
    const updatedOrder = await prisma.Order.update({
      where: { id: orderId },
      data: {
        spk: validatedData.spk,
        no_project: validatedData.no_project,
        tanggal: validatedData.tanggal,
        // Use target_selesai or est_order depending on your schema 
        est_order: validatedData.target_selesai,
        customer_id: validatedData.customer_id,
        marketing: validatedData.marketing, // Store as string
        produk: validatedData.produk,
        asal_bahan: validatedData.asal_bahan,
        qty: validatedData.qty,
        harga_satuan: validatedData.harga,
        status: validatedData.status,
        catatan: validatedData.catatan,
        updated_at: new Date(),
      },
      include: {
        customer: true
      },
    });

    // Process the marketing field which is a string, not a relation
    const processedOrder = {
      ...updatedOrder,
      marketingInfo: updatedOrder.marketing ? { name: updatedOrder.marketing } : null
    };

    return NextResponse.json(serializeData(processedOrder));
  } catch (error: any) {
    console.error("Error updating order:", error);
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

// DELETE: Delete order by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = await params.id;

    // Check if order exists
    const existingOrder = await prisma.Order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404 }
      );
    }

    // Delete the order
    await prisma.Order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting order:", error);
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