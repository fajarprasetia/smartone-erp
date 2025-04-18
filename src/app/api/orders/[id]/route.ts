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
  jenisProduk: z.object({
    PRINT: z.boolean().optional(),
    PRESS: z.boolean().optional(),
    CUTTING: z.boolean().optional(),
    DTF: z.boolean().optional(),
    SEWING: z.boolean().optional()
  }).optional(),
  dtfPass: z.enum(["4 PASS", "6 PASS"]).optional(),
  unit: z.enum(["meter", "yard"]).optional(), // Unit for fabric measurement
  repeatOrderSpk: z.string().optional(), // For repeat orders
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

    // Ensure datetime fields are properly formatted
    console.log("[API] Raw date values:", {
      est_order: order.est_order,
      est_order_type: typeof order.est_order,
      created_at: order.created_at,
      created_at_type: typeof order.created_at
    });

    // Create a copy with explicitly converted date fields
    const processedOrder = {
      ...order,
      est_order: order.est_order ? new Date(order.est_order).toISOString() : null,
      created_at: order.created_at ? new Date(order.created_at).toISOString() : null,
      marketingInfo
    };

    console.log("[API] Processed date values:", {
      est_order: processedOrder.est_order,
      created_at: processedOrder.created_at
    });

    // Format and return the order with all fields properly serialized
    return NextResponse.json(serializeData(processedOrder));
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
    
    // Safely parse request body
    let body;
    try {
      const rawText = await req.text();
      console.log(`[API] Raw request body: ${rawText}`);
      body = JSON.parse(rawText);
    } catch (parseError) {
      console.error(`[API] Error parsing request body:`, parseError);
      return NextResponse.json(
        { 
          error: "Failed to parse request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
        },
        { status: 400 }
      );
    }

    console.log(`[API] Updating order with ID: ${orderId}`);
    console.log(`[API] Parsed body:`, body);

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

    // Check if customer exists - use customerId field if present or fall back to customer_id
    const customerId = validatedData.customerId || validatedData.customer_id;
    
    if (customerId) {
      const customer = await db.customer.findUnique({
        where: { 
          id: customerId 
        }
      });
      
      if (!customer) {
        console.log(`[API] Customer with ID ${customerId} not found`);
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 400 }
        );
      }
    }

    console.log(`[API] Updating order...`);
    
    try {
      // Create update data object with only the fields we want to update
      const updateData: any = {
        updated_at: new Date(),
      };
      
      // Handle all the fields that might be updated
      if (validatedData.spk) updateData.spk = validatedData.spk;
      if (validatedData.no_project) updateData.no_project = validatedData.no_project;
      
      // Handle date fields
      if (validatedData.tanggal) {
        try {
          const tanggalValue = validatedData.tanggal;
          console.log(`[API] Processing tanggal field:`, tanggalValue);
          
          if (tanggalValue instanceof Date) {
            updateData.tanggal = tanggalValue;
          } else if (typeof tanggalValue === 'string') {
            // Try direct parsing
            updateData.tanggal = new Date(tanggalValue);
          }
          
          console.log(`[API] Resulting tanggal:`, updateData.tanggal);
        } catch (err) {
          console.error(`[API] Error processing tanggal:`, err);
        }
      }
      
      if (validatedData.targetSelesai || validatedData.target_selesai) {
        try {
          const targetDate = validatedData.targetSelesai || validatedData.target_selesai;
          console.log(`[API] Processing target date field:`, targetDate);
          
          if (targetDate instanceof Date) {
            // Use est_order as the DB field name for targetSelesai
            updateData.est_order = targetDate;
            console.log(`[API] Set est_order to:`, updateData.est_order);
          } else if (typeof targetDate === 'string') {
            // Try direct parsing
            updateData.est_order = new Date(targetDate);
            console.log(`[API] Set est_order to:`, updateData.est_order);
          }
          
          // Remove any incorrect field names if they exist
          if ('targetSelesai' in updateData) {
            delete updateData.targetSelesai;
          }
          if ('target_selesai' in updateData) {
            delete updateData.target_selesai;
          }
          if ('estOrder' in updateData) {
            delete updateData.estOrder;
          }
        } catch (err) {
          console.error(`[API] Error processing target date:`, err);
        }
      }
      
      // Handle customer ID
      if (customerId) {
        console.log(`Processing customerId: ${customerId}`);
        delete updateData.customerId;
        updateData.customer = { connect: { id: customerId } };
      }
      
      // Handle marketing
      if (validatedData.marketing) updateData.marketing = validatedData.marketing;
      
      // Handle product related fields
      if (validatedData.produk) updateData.produk = validatedData.produk;
      if (validatedData.aplikasiProduk || validatedData.nama_produk) {
        updateData.nama_produk = validatedData.aplikasiProduk || validatedData.nama_produk;
      }
      
      // Check if this is a DTF order
      let isDtfOrder = false;
      
      // Check if the product has 'DTF' in its produk field
      if (validatedData.produk && validatedData.produk.includes('DTF')) {
        isDtfOrder = true;
        console.log('[API] DTF product detected from produk field');
      }
      
      // Also check jenisProduk if available
      if (validatedData.jenisProduk && validatedData.jenisProduk.DTF === true) {
        isDtfOrder = true;
        console.log('[API] DTF product detected from jenisProduk field');
      }
      
      // Check tipe_produk if available
      if (validatedData.tipe_produk === 'DTF') {
        isDtfOrder = true;
        console.log('[API] DTF product detected from tipe_produk field');
      }
      
      console.log(`[API] Is DTF order: ${isDtfOrder}`);
      
      // For DTF orders, clear fabric-related fields
      if (isDtfOrder) {
        updateData.nama_kain = "";
        updateData.jumlah_kain = "";
        updateData.lebar_kain = "";
        
        // Remove any fabric relation
        if (updateData.asal_bahan_rel) {
          delete updateData.asal_bahan_rel;
        }
        
        console.log('[API] Cleared fabric-related fields for DTF order');
      } else {
        // Only process fabric fields for non-DTF orders
        if (validatedData.namaBahan || validatedData.nama_kain) {
          updateData.nama_kain = validatedData.namaBahan || validatedData.nama_kain;
        }
        
        if (validatedData.fabricLength || validatedData.jumlah_kain) {
          updateData.jumlah_kain = validatedData.fabricLength || validatedData.jumlah_kain;
        }
        
        if (validatedData.lebarKain || validatedData.lebar_kain) {
          updateData.lebar_kain = validatedData.lebarKain || validatedData.lebar_kain;
        }
      }
      
      // Handle quantity and unit
      if (validatedData.qty || validatedData.jumlah) {
        updateData.qty = validatedData.qty || validatedData.jumlah;
      }
      if (validatedData.unit) updateData.satuan_bahan = validatedData.unit;
      
      // Handle price
      if (validatedData.harga || validatedData.harga_satuan) {
        updateData.harga_satuan = validatedData.harga || validatedData.harga_satuan;
      }
      
      // Handle status fields
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.statusm) updateData.statusm = validatedData.statusm;
      if (validatedData.statusProduksi) updateData.statusprod = validatedData.statusProduksi;
      
      // Handle notes
      if (validatedData.catatan || validatedData.notes) {
        updateData.catatan = validatedData.catatan || validatedData.notes;
      }
      
      // Handle fabric origin field
      if (validatedData.asalBahan || validatedData.asal_bahan) {
        try {
          const asalBahan = validatedData.asalBahan || validatedData.asal_bahan;
          console.log("[API] Processing fabric origin:", asalBahan);
          
          // Remove the direct asal_bahan field which doesn't exist in the schema
          if ('asal_bahan' in updateData) {
            delete updateData.asal_bahan;
          }
          
          // For CUSTOMER origin - connect to the customer ID
          if (asalBahan === "CUSTOMER" && customerId) {
            updateData.asal_bahan_rel = {
              connect: {
                id: customerId
              }
            };
            console.log("[API] Set fabric origin to customer:", customerId);
          } 
          // For SMARTONE origin - find SMARTONE customer and connect to it
          else if (asalBahan === "SMARTONE") {
            // Try to find the SMARTONE customer ID (could be hardcoded or looked up)
            try {
              const smartoneCustomer = await db.customer.findFirst({
                where: {
                  nama: {
                    contains: "SMARTONE",
                    mode: 'insensitive'
                  }
                }
              });
              
              if (smartoneCustomer) {
                updateData.asal_bahan_rel = {
                  connect: {
                    id: smartoneCustomer.id
                  }
                };
                console.log("[API] Set fabric origin to SMARTONE:", smartoneCustomer.id);
              } else {
                console.warn("[API] Could not find SMARTONE customer, not setting fabric origin");
              }
            } catch (error) {
              console.error("[API] Error finding SMARTONE customer:", error);
            }
          }
          // For other values, store in tipe_produk field instead (if it exists in the schema)
          else if (asalBahan && asalBahan !== "CUSTOMER" && asalBahan !== "SMARTONE") {
            updateData.tipe_produk = String(asalBahan);
            console.log("[API] Stored fabric origin in tipe_produk:", asalBahan);
          }
        } catch (err) {
          console.error("[API] Error processing fabric origin:", err);
        }
      }

      // Handle paper info
      if (validatedData.gsmKertas || validatedData.gramasi) {
        updateData.gramasi = validatedData.gsmKertas || validatedData.gramasi;
      }
      if (validatedData.lebarKertas || validatedData.lebar_kertas) {
        updateData.lebar_kertas = validatedData.lebarKertas || validatedData.lebar_kertas;
      }
      if (validatedData.fileWidth || validatedData.lebar_file) {
        updateData.lebar_file = validatedData.fileWidth || validatedData.lebar_file;
      }
      
      // Handle color matching
      if (validatedData.matchingColor) {
        updateData.warna_acuan = validatedData.matchingColor;
      }
      if (validatedData.warna_acuan) {
        updateData.warna_acuan = validatedData.warna_acuan;
      }
      
      // Handle file path
      if (validatedData.fileDesain || validatedData.path) {
        updateData.path = validatedData.fileDesain || validatedData.path;
      }
      
      // Handle kategori
      if (validatedData.kategori) updateData.kategori = validatedData.kategori;
      
      // Handle total price
      if (validatedData.totalPrice) updateData.nominal = validatedData.totalPrice;
      
      // Handle repeat order info
      if (validatedData.repeatOrderSpk) updateData.repeat_order_spk = validatedData.repeatOrderSpk;
      
      // Handle priority field
      if (validatedData.priority !== undefined) {
        updateData.prioritas = validatedData.priority ? "YES" : "NO";
      }
      
      // Handle product types (jenisProduk)
      if (validatedData.jenisProduk) {
        // Combine product types into a single string, e.g., "PRINT,PRESS"
        const productTypes = Object.entries(validatedData.jenisProduk)
          .filter(([_, isSelected]) => isSelected)
          .map(([type, _]) => type)
          .join(",");
        
        if (productTypes) updateData.produk = productTypes;
        
        // If DTF is selected, also update DTF pass
        if (validatedData.jenisProduk.DTF && validatedData.dtfPass) {
          updateData.produk = `${updateData.produk || ""} ${validatedData.dtfPass}`;
        }
      }
      
      // Handle discount
      if (validatedData.discountType && validatedData.discountValue) {
        if (validatedData.discountType === "percentage") {
          updateData.diskon = `${validatedData.discountValue}%`;
        } else if (validatedData.discountType === "fixed") {
          updateData.diskon = validatedData.discountValue;
        } else {
          updateData.diskon = null;
        }
      }
      
      // Handle tax data - store tax percentage in tambah_bahan field
      if (validatedData.tax !== undefined) {
        const isTaxEnabled = validatedData.tax === true || validatedData.tax === "YES" || validatedData.tax === "true";
        
        if (isTaxEnabled && validatedData.taxPercentage) {
          updateData.tambah_bahan = `Tax: ${validatedData.taxPercentage}%`;
        } else {
          updateData.tambah_bahan = null;
        }
      } else if (validatedData.tambah_bahan && validatedData.tambah_bahan.includes("Tax:")) {
        // Keep the existing tambah_bahan if it contains tax information
        updateData.tambah_bahan = validatedData.tambah_bahan;
      }

      // Before executing the update, check if we have the right field names
      // This will help identify if there are any discrepancies between our code and the Prisma schema
      try {
        console.log("[API] Checking field names against Prisma schema...");
        
        // Based on error messages, we need to use the database column names
        const camelToSnakeFields = [
          { camel: 'customerId', snake: 'customer_id' },
          { camel: 'asalBahanId', snake: 'asal_bahan_id' },
          { camel: 'estOrder', snake: 'est_order' },
          { camel: 'targetSelesai', snake: 'est_order' } // targetSelesai maps to est_order in DB
        ];
        
        for (const field of camelToSnakeFields) {
          if (field.camel in updateData) {
            console.warn(`[API] Converting camelCase ${field.camel} to snake_case ${field.snake}`);
            // Use snake_case for database column names
            updateData[field.snake] = updateData[field.camel];
            delete updateData[field.camel];
          }
        }
        
        // Check specific field names just to be safe
        if ('customer_id' in updateData) {
          console.log("[API] Using customer_id field as expected by database schema");
        }
        
        if ('asal_bahan_id' in updateData) {
          console.log("[API] Using asal_bahan_id field as expected by database schema");
        }
      } catch (checkError) {
        console.error("[API] Error while checking field names:", checkError);
      }

      // Before executing the update, remove any unexpected fields
      if ('asal_bahan' in updateData) {
        console.warn("[API] Removing invalid asal_bahan field:", updateData.asal_bahan);
        delete updateData.asal_bahan;
      }

      // Remove fields that don't exist in the Prisma schema
      if ('tax' in updateData) {
        console.warn("[API] Removing non-schema field 'tax'");
        delete updateData.tax;
      }

      if ('tax_percentage' in updateData) {
        console.warn("[API] Removing non-schema field 'tax_percentage'");
        delete updateData.tax_percentage;
      }

      // Process asalBahanId field
      const asalBahanId = updateData.asalBahanId;
      if (asalBahanId && !isDtfOrder) {
        console.log(`Processing asalBahanId: ${asalBahanId}`);
        delete updateData.asalBahanId;
        delete updateData.asal_bahan_id; // Remove deprecated field

        // Only add relation if we have a valid ID
        if (/^\d+$/.test(asalBahanId)) {
          updateData.asal_bahan_rel = { connect: { id: asalBahanId } };
        }
      } else if (isDtfOrder) {
        // For DTF orders, remove any asalBahan data
        delete updateData.asalBahanId;
        delete updateData.asal_bahan_id;
        console.log('[API] Removed asalBahan data for DTF order');
      }

      // Process tipe_produk field (comes from non-CUSTOMER, non-SMARTONE asalBahan values)
      if (updateData.tipe_produk) {
        console.log(`Processing tipe_produk: ${updateData.tipe_produk}`);
      }

      // Clean up fields that aren't in the schema
      delete updateData.asal_bahan;
      delete updateData.asalBahan;
      
      console.log('Cleaned update data:', JSON.stringify(updateData, null, 2));

      // Update the order
      console.log("[API] About to update order with data:", JSON.stringify(updateData, null, 2));

      // Perform the update in a try/catch block
      console.log("[API] Executing update for order ID:", orderId);

      // First, check if the order exists
      try {
        const orderExists = await db.order.findUnique({
          where: { id: orderId },
          select: { id: true }
        });
        
        if (!orderExists) {
          console.error(`[API] Order with ID ${orderId} not found before update`);
          return NextResponse.json(
            { error: "Order not found", details: "Cannot update non-existent order" },
            { status: 404 }
          );
        }
        
        console.log("[API] Order exists, proceeding with update");
      } catch (checkError) {
        console.error("[API] Error checking if order exists:", checkError);
        // Continue with update attempt
      }

      let updatedOrder;

      try {
        updatedOrder = await db.order.update({
          where: { id: orderId },
          data: updateData,
          include: {
            customer: true,
            asal_bahan_rel: true,
          },
        });
        console.log(`[API] Successfully updated order:`, updatedOrder ? "yes" : "no");
      } catch (updateError: any) {
        console.error("[API] Error during update operation:", updateError);
        console.error("[API] Error message:", updateError.message);
        
        // Re-throw the error to be caught by the outer catch block
        throw updateError;
      }

      console.log(`[API] Order updated successfully`);
      return NextResponse.json(serializeData(updatedOrder));
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
  } catch (error: any) {
    console.error("[API] Error updating order:", error);
    
    if (error.code) {
      console.error("[API] Database error code:", error.code);
      console.error("[API] Error meta:", error.meta);
      
      if (error.meta?.target) {
        console.error("[API] Problem field:", error.meta.target);
      }
      
      if (error.code === 'P2025') {
        // Record not found error
        return NextResponse.json(
          { 
            error: "Order not found",
            details: "The order may have been deleted or the ID is invalid"
          },
          { status: 404 }
        );
      } else if (error.code === 'P2002') {
        // Unique constraint violation
        return NextResponse.json(
          { 
            error: "Unique constraint violation",
            details: `Field ${error.meta?.target} already exists with this value`
          },
          { status: 400 }
        );
      } else if (error.code === 'P2003') {
        // Foreign key constraint violation
        return NextResponse.json(
          { 
            error: "Foreign key constraint violation",
            details: `The referenced ${error.meta?.target} does not exist`
          },
          { status: 400 }
        );
      }
    }
    
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

// PATCH: Update partial data for design workflow
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    console.log(`[API] PATCH request for order ID: ${orderId}`);

    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await req.json();
    console.log("[API] Design update data:", data);

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

    // Prepare update data
    const updateData: any = {
      designer_id: session.user.id, // Set current user as designer
    };
    
    // Validate and convert data types
    if (data.lebar_file !== undefined) updateData.lebar_file = String(data.lebar_file);
    if (data.warna_acuan !== undefined) updateData.warna_acuan = String(data.warna_acuan);
    if (data.qty !== undefined) updateData.qty = String(data.qty);
    if (data.catatan !== undefined) updateData.catatan = String(data.catatan);
    if (data.statusm !== undefined) updateData.statusm = String(data.statusm);
    
    // Add capture file paths if they exist
    if (data.capture !== undefined) updateData.capture = String(data.capture);
    if (data.capture_name !== undefined) updateData.capture_name = String(data.capture_name);

    // Update the order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true,
        asal_bahan_rel: true,
      },
    });

    console.log(`[API] Order updated successfully for design workflow`);
    return NextResponse.json(serializeData(updatedOrder));
  } catch (error: any) {
    console.error("[API] Error processing design update:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to update design",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}