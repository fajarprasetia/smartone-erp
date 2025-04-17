import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Schema for order update validation
const orderUpdateSchema = z.object({
  spk: z.string().optional(),
  no_project: z.string().optional(),
  tanggal: z.date().optional(),
  target_selesai: z.date().optional(),
  customer_id: z.coerce.string(),
  marketing: z.string().optional(),
  produk: z.string().min(1, { message: "Product is required" }),
  asal_bahan: z.string().optional(),
  panjang: z.coerce.number().optional(),
  qty: z.string().optional(),
  harga: z.string().optional(),
  status: z.string(),
  catatan: z.string().optional(),
  tax: z.boolean().optional(),
  taxPercentage: z.string().optional(),
  priority: z.boolean().optional(),
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
    const orderId = params.id;
    console.log(`[API] Fetching order with ID: ${orderId}`);

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch the order by ID
    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
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
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      console.log(`[API] Order with ID ${orderId} not found`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`[API] Successfully found order with ID: ${orderId}`);

    // Process marketing field to determine if it's a user ID or plain string
    let marketingInfo = null;
    
    if (order.marketing) {
      try {
        // Try to interpret the marketing field as a user ID
        const user = await db.user.findUnique({
          where: { id: order.marketing },
          select: { id: true, name: true, email: true }
        });
        
        if (user) {
          marketingInfo = {
            id: user.id,
            name: user.name,
            email: user.email
          };
        } else {
          // Fallback: treat marketing as a plain string if not a valid user ID
          marketingInfo = { name: order.marketing };
        }
      } catch (error) {
        console.error('Error fetching marketing user:', error);
        // Fallback to using the marketing field as a name
        marketingInfo = { name: order.marketing };
      }
    }

    // Format and return the order with all fields properly serialized
    return NextResponse.json(serializeData({
      ...order,
      marketingInfo,
      // Add any additional formatted fields here
    }));
  } catch (error: any) {
    console.error("Error fetching order by ID:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch order",
        details: error.message || "Unknown error occurred"
      },
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
    const orderId = params.id;
    const body = await req.json();

    console.log(`[API] Updating order with ID: ${orderId}`);

    // Validate input
    const validationResult = orderUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(`[API] Validation failed:`, validationResult.error.format());
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      console.log(`[API] Order with ID ${orderId} not found`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if customer exists
    const customer = await db.customer.findUnique({
      where: { 
        id: validatedData.customer_id 
      }
    });
    
    if (!customer) {
      console.log(`[API] Customer with ID ${validatedData.customer_id} not found`);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }

    console.log(`[API] Updating order...`);
    
    try {
      // Create update data object with only the fields we want to update
      const updateData: any = {
        spk: validatedData.spk,
        no_project: validatedData.no_project,
        tanggal: validatedData.tanggal,
        est_order: validatedData.target_selesai,
        marketing: validatedData.marketing,
        produk: validatedData.produk,
        qty: validatedData.qty,
        harga_satuan: validatedData.harga,
        status: validatedData.status,
        catatan: validatedData.catatan,
        updated_at: new Date(),
      };
      
      // Handle priority field
      if (validatedData.priority !== undefined) {
        updateData.prioritas = validatedData.priority ? "YES" : "NO";
      }
      
      // Handle tax data - store tax percentage in tambah_bahan field
      if (validatedData.tax !== undefined) {
        if (validatedData.tax && validatedData.taxPercentage) {
          updateData.tambah_bahan = `Tax: ${validatedData.taxPercentage}%`;
        } else {
          updateData.tambah_bahan = null;
        }
      }
      
      // Only set customer_id if it's valid and needed
      if (validatedData.customer_id) {
        updateData.customer_id = validatedData.customer_id;
      }
      
      // Only set asal_bahan if it's provided
      if (validatedData.asal_bahan) {
        updateData.asal_bahan = validatedData.asal_bahan;
      }

      // Update the order
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          customer: true,
          asal_bahan_rel: true,
        },
      });
      
      console.log(`[API] Order updated successfully`);
      return NextResponse.json(serializeData(updatedOrder));
    } catch (dbError: any) {
      console.error("[API] Database error updating order:", dbError);
      return NextResponse.json(
        { 
          error: "Database error updating order",
          details: dbError.message || "Unknown database error"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Error updating order:", error);
    return NextResponse.json(
      { 
        error: "Failed to update order",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete an order by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    console.log(`[API] Deleting order with ID: ${orderId}`);

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      console.log(`[API] Order with ID ${orderId} not found for deletion`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete the order
    await db.order.delete({
      where: { id: orderId },
    });

    console.log(`[API] Order with ID ${orderId} deleted successfully`);
    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    console.error("[API] Error deleting order:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete order",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}