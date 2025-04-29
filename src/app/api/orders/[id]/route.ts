import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bigIntSerializer } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Schema for order update validation
const orderUpdateSchema = z.object({
  spk: z.string().optional(),
  no_project: z.string().optional(),
  tanggal: z.union([z.date(), z.string()]).optional(),
  target_selesai: z.union([z.date(), z.string()]).optional(),
  targetSelesai: z.union([z.date(), z.string()]).optional(), // Alternative field name from form
  customer_id: z.coerce.string(),
  customerId: z.string().optional(), // Alternative field name from form
  marketing: z.string().optional(),
  produk: z.string().optional(),
  aplikasiProduk: z.string().optional(), // From form
  nama_produk: z.string().optional(), // DB field name
  asal_bahan: z.string().optional(),
  asalBahan: z.string().optional(), // Alternative field name from form
  asalBahanId: z.string().optional(), // Related to asal_bahan_id
  panjang: z.coerce.number().optional(),
  qty: z.coerce.string().optional(),
  jumlah: z.coerce.string().optional(), // Alternative field name from form
  harga: z.string().optional(),
  harga_satuan: z.string().optional(), // DB field name
  status: z.string().optional(),
  statusm: z.string().optional(), // Status marketing
  statusProduksi: z.enum(["NEW", "REPEAT"]).optional(), // Production status
  catatan: z.string().optional(),
  notes: z.string().optional(), // Alternative field name from form
  // Store tax info in tambah_bahan field instead
  tambah_bahan: z.string().optional(), // Field for storing tax info and other data
  priority: z.boolean().optional(),
  kategori: z.enum(["REGULAR ORDER", "ONE DAY SERVICE", "PROJECT"]).optional(),
  additionalCosts: z.array(
    z.object({
      item: z.string(),
      pricePerUnit: z.string(),
      unitQuantity: z.string(),
      total: z.string()
    })
  ).optional(),
  totalPrice: z.string().optional(), // Total price of the order
  // Accept both string and object formats for jenisProduk
  jenisProduk: z.union([
    z.string(),
    z.object({
      PRINT: z.boolean().optional(),
      PRESS: z.boolean().optional(),
      CUTTING: z.boolean().optional(),
      DTF: z.boolean().optional(),
      SEWING: z.boolean().optional()
    })
  ]).optional(),
  dtfPass: z.enum(["4 PASS", "6 PASS"]).optional(),
  unit: z.enum(["meter", "yard", "piece"]).optional(), // Unit for fabric measurement
  namaBahan: z.string().optional(), // Fabric name from form
  nama_kain: z.string().optional(), // DB field name
  jumlah_kain: z.string().optional(), // DB field name for fabric length
  fabricLength: z.string().optional(), // Form field name for fabric length
  gsmKertas: z.string().optional(), // Paper GSM from form
  gramasi: z.string().optional(), // DB field name
  lebarKertas: z.string().optional(), // Paper width from form
  lebar_kertas: z.string().optional(), // DB field name
  fileWidth: z.string().optional(), // File width from form
  lebar_file: z.string().optional(), // DB field name
  matchingColor: z.enum(["YES", "NO"]).optional(), // Color matching option
  warna_acuan: z.string().optional(), // DB field name
  fileDesain: z.string().optional(), // Design file path
  path: z.string().optional(), // DB field name
  selectedFabric: z.object({
    id: z.string().optional(),
    name: z.string(),
    composition: z.string().nullable().optional(),
    length: z.string().nullable().optional(),
    width: z.string().nullable().optional(),
    remainingLength: z.string().nullable().optional()
  }).optional(),
  discountType: z.enum(["percentage", "fixed", "none"]).optional(),
  discountValue: z.string().optional(),
  tax: z.boolean().optional(),
  taxPercentage: z.string().optional(),
});

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  // First use the bigIntSerializer
  const bigIntSerialized = bigIntSerializer(data);
  
  // Then handle date serialization
  return serializeDates(bigIntSerialized);
}

// Helper function to serialize dates properly
function serializeDates(data: any): any {
  if (!data) return data;
  
  // Is this a Date object?
  if (data instanceof Date) {
    if (isNaN(data.getTime())) {
      return null; // Invalid date
    }
    return data.toISOString(); // Return ISO string format
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeDates(item));
  }
  
  // Handle objects recursively
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeDates(data[key]);
    }
    return result;
  }
  
  // Return primitive values as is
  return data;
}

// Helper function to safely parse date values
function parseDateValue(value: string | Date | undefined): Date | undefined {
  if (!value) {
    console.log("[API] parseDateValue: No value provided");
    return undefined;
  }
  
  console.log("[API] parseDateValue input:", typeof value, value);
  
  try {
    if (value instanceof Date) {
      console.log("[API] parseDateValue: Already a Date instance");
      return value;
    }
    
    // Handle string format date
    const parsedDate = new Date(value);
    
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      console.log("[API] parseDateValue: Invalid date after parsing:", value);
      return undefined;
    }
    
    console.log("[API] parseDateValue: Successfully parsed date:", parsedDate);
    return parsedDate;
  } catch (error) {
    console.error("[API] parseDateValue: Error parsing date:", error, "Value:", value);
    return undefined;
  }
}

// GET: Fetch single order by ID
export async function GET(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`[API] Fetching order with ID: ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch the order by ID
    const order = await db.order.findUnique({
      where: {
        id: id,
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
      console.log(`[API] Order with ID ${id} not found`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`[API] Successfully found order with ID: ${id}`);

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

    // Ensure datetime fields are properly formatted
    console.log("[API] Raw date values:", {
      tanggal: order.tanggal,
      created_at: order.created_at,
      updated_at: order.updated_at
    });

    // Serialize the order data
    const serializedOrder = serializeData({
      ...order,
      marketingInfo,
      tanggal: order.tanggal ? new Date(order.tanggal).toISOString() : null,
      created_at: order.created_at ? new Date(order.created_at).toISOString() : null,
      updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : null,
    });

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[API] Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT: Update an existing order
export async function PUT(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`[API] Updating order with ID: ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await _req.json();
    const validationResult = orderUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("[API] Validation error:", validationResult.error);
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare update data
      const updateData: any = {
      ...validatedData,
      // Handle date fields
      tanggal: parseDateValue(validatedData.tanggal),
      // Handle customer ID
      customer_id: validatedData.customer_id || validatedData.customerId,
      // Handle marketing field
      marketing: validatedData.marketing,
      // Handle product fields
      produk: validatedData.produk || validatedData.aplikasiProduk,
      nama_produk: validatedData.nama_produk,
      // Handle fabric fields
      asal_bahan: validatedData.asal_bahan || validatedData.asalBahan,
      asal_bahan_id: validatedData.asalBahanId,
      // Handle quantity fields
      qty: validatedData.qty || validatedData.jumlah,
      // Handle price fields
      harga_satuan: validatedData.harga_satuan || validatedData.harga,
      // Handle status fields
      status: validatedData.status,
      statusm: validatedData.statusm,
      status_produksi: validatedData.statusProduksi,
      // Handle notes
      catatan: validatedData.catatan || validatedData.notes,
      // Handle fabric fields
      nama_kain: validatedData.nama_kain || validatedData.namaBahan,
      jumlah_kain: validatedData.jumlah_kain || validatedData.fabricLength,
      // Handle paper fields
      gramasi: validatedData.gramasi || validatedData.gsmKertas,
      lebar_kertas: validatedData.lebar_kertas || validatedData.lebarKertas,
      lebar_file: validatedData.lebar_file || validatedData.fileWidth,
      // Handle color matching
      warna_acuan: validatedData.warna_acuan,
      // Handle design file
      path: validatedData.path || validatedData.fileDesain,
      // Handle additional fields
      tambah_bahan: validatedData.tambah_bahan,
      priority: validatedData.priority,
      kategori: validatedData.kategori,
      // Update timestamp
      updated_at: new Date(),
    };

      // Update the order
    const updatedOrder = await db.order.update({
      where: { id: id },
          data: updateData,
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

    // Serialize the updated order
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[API] Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Delete an order
export async function DELETE(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`[API] Deleting order with ID: ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete the order
    await db.order.delete({
      where: { id: id },
    });

    return NextResponse.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Partially update an order
export async function PATCH(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`[API] Partially updating order with ID: ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await _req.json();
    const validationResult = orderUpdateSchema.partial().safeParse(body);

    if (!validationResult.success) {
      console.error("[API] Validation error:", validationResult.error);
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      // Handle date fields if provided
      ...(validatedData.tanggal && { tanggal: parseDateValue(validatedData.tanggal) }),
      // Handle customer ID if provided
      ...(validatedData.customer_id && { customer_id: validatedData.customer_id || validatedData.customerId }),
      // Handle marketing field if provided
      ...(validatedData.marketing && { marketing: validatedData.marketing }),
      // Handle product fields if provided
      ...(validatedData.produk && { produk: validatedData.produk || validatedData.aplikasiProduk }),
      ...(validatedData.nama_produk && { nama_produk: validatedData.nama_produk }),
      // Handle fabric fields if provided
      ...(validatedData.asal_bahan && { asal_bahan: validatedData.asal_bahan || validatedData.asalBahan }),
      ...(validatedData.asalBahanId && { asal_bahan_id: validatedData.asalBahanId }),
      // Handle quantity fields if provided
      ...(validatedData.qty && { qty: validatedData.qty || validatedData.jumlah }),
      // Handle price fields if provided
      ...(validatedData.harga_satuan && { harga_satuan: validatedData.harga_satuan || validatedData.harga }),
      // Handle status fields if provided
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.statusm && { statusm: validatedData.statusm }),
      ...(validatedData.statusProduksi && { status_produksi: validatedData.statusProduksi }),
      // Handle notes if provided
      ...(validatedData.catatan && { catatan: validatedData.catatan || validatedData.notes }),
      // Handle fabric fields if provided
      ...(validatedData.nama_kain && { nama_kain: validatedData.nama_kain || validatedData.namaBahan }),
      ...(validatedData.jumlah_kain && { jumlah_kain: validatedData.jumlah_kain || validatedData.fabricLength }),
      // Handle paper fields if provided
      ...(validatedData.gramasi && { gramasi: validatedData.gramasi || validatedData.gsmKertas }),
      ...(validatedData.lebar_kertas && { lebar_kertas: validatedData.lebar_kertas || validatedData.lebarKertas }),
      ...(validatedData.lebar_file && { lebar_file: validatedData.lebar_file || validatedData.fileWidth }),
      // Handle color matching if provided
      ...(validatedData.warna_acuan && { warna_acuan: validatedData.warna_acuan }),
      // Handle design file if provided
      ...(validatedData.path && { path: validatedData.path || validatedData.fileDesain }),
      // Handle additional fields if provided
      ...(validatedData.tambah_bahan && { tambah_bahan: validatedData.tambah_bahan }),
      ...(validatedData.priority && { priority: validatedData.priority }),
      ...(validatedData.kategori && { kategori: validatedData.kategori }),
      // Update timestamp
      updated_at: new Date(),
    };

    // Update the order
    const updatedOrder = await db.order.update({
      where: { id: id },
      data: updateData,
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

    // Serialize the updated order
    const serializedOrder = serializeData(updatedOrder);

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[API] Error partially updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}