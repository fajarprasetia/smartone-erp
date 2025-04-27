import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { yardToMeter } from "@/app/(dashboard)/order/add/utils/order-form-utils";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          return null; // Invalid date
        }
        return value.toISOString(); // Return as ISO string
      }
      
      return value;
    })
  );
}

// Add a serialization function to handle BigInt values
function serializeOrderData(data: any) {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert BigInt to string
    if (typeof value === 'bigint') {
      return value.toString();
    }
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Get pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const exclude = url.searchParams.get("exclude") || "";
    
    // Get sorting parameters
    const sortField = url.searchParams.get("sortField") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    
    // Calculate skip value for pagination (0 for page 1, pageSize for page 2, etc.)
    const skip = (page - 1) * pageSize;
    
    // Prepare filter conditions
    let whereCondition: any = {};

    // Add search condition if search is provided
    if (search) {
      whereCondition.OR = [
        { spk: { contains: search, mode: "insensitive" } },
        { no_project: { contains: search, mode: "insensitive" } },
        { produk: { contains: search, mode: "insensitive" } },
        { nama_kain: { contains: search, mode: "insensitive" } },
        { status: { contains: search, mode: "insensitive" } },
        { statusm: { contains: search, mode: "insensitive" } },
        { catatan: { contains: search, mode: "insensitive" } },
        { marketing: { contains: search, mode: "insensitive" } },
        { customer: { nama: { contains: search, mode: "insensitive" } } },
        { customer: { telp: { contains: search } } },
      ];
    }

    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    }

    // Add exclude filter if provided
    if (exclude) {
      whereCondition.NOT = whereCondition.NOT || [];
      whereCondition.NOT.push({ status: exclude });
    }

    // Get total count for pagination
    const totalCount = await db.order.count({
      where: whereCondition,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Prepare orderBy object dynamically
    const orderBy: Record<string, string> = {};
    
    // Handle special case for date fields to ensure proper sorting
    if (sortField === "tanggal" || sortField === "created_at") {
      // For date fields, use the field directly for sorting
      orderBy[sortField] = sortOrder;
    } else {
      // For other fields, use the standard sorting
      orderBy[sortField] = sortOrder;
    }

    // Fetch orders with pagination and include customer data
    const orders = await db.order.findMany({
      where: whereCondition,
      include: {
        customer: true,
      },
      skip,
      take: pageSize,
      orderBy,
    });

    // For orders with customer_id but no customer relation, fetch from lowercase customer model
    const processedOrders = await Promise.all(orders.map(async (order: any) => {
      let customerData = order.customer;
      
      // If no customer data from relation but has customer_id, try to fetch from lowercase customer model
      if (!customerData && order.customer_id) {
        try {
          const lowercaseCustomer = await db.$queryRaw`
            SELECT id, nama, telp FROM customer WHERE id = ${order.customer_id}
          `;
          
          if (Array.isArray(lowercaseCustomer) && lowercaseCustomer.length > 0) {
            customerData = {
              id: lowercaseCustomer[0].id.toString(),
              nama: lowercaseCustomer[0].nama,
              telp: lowercaseCustomer[0].telp
            };
          }
        } catch (error) {
          console.error('Error fetching lowercase customer:', error);
        }
      }
      
      // Fetch marketing user data if marketing field contains a user ID
      let marketingUser = null;
      if (order.marketing) {
        try {
          // Try to interpret the marketing field as a user ID
          const user = await db.user.findUnique({
            where: { id: order.marketing },
            select: { id: true, name: true, email: true }
          });
          
          if (user) {
            marketingUser = {
              id: user.id,
              name: user.name,
              email: user.email
            };
          } else {
            // Fallback: treat marketing as a plain string if not a valid user ID
            marketingUser = { name: order.marketing };
          }
        } catch (error) {
          console.error('Error fetching marketing user:', error);
          // Fallback to using the marketing field as a name
          marketingUser = { name: order.marketing };
        }
      }

      let designer_id = null;
      if (order.designer_id) {
        try {
          // Try to interpret the designer_id field as a user ID
          const user = await db.user.findUnique({
            where: { id: order.designer_id },
            select: { id: true, name: true, email: true }
          });
          
          if (user) {
            designer_id = {
              id: user.id,
              name: user.name,
              email: user.email
            };
          } else {
            // Fallback: treat designer as a plain string if not a valid user ID
            designer_id = { name: order.designer_id };
          }
        } catch (error) {
          console.error('Error fetching designer user:', error);
          // Fallback to using the designer field as a name
          designer_id = { name: order.designer_id };
        }
      }
      
      // Fetch fabric origin (asal_bahan) customer data
      let originCustomer = null;
      if (order.asal_bahan_id || order.asal_bahan) {
        try {
          // Special case: If asal_bahan is "27", use the order's customer_id instead
          let originCustomerId;
          
          if (order.asal_bahan === "27" || order.asal_bahan_id === "27") {
            // Use the order's customer_id if asal_bahan is "27"
            originCustomerId = order.customer_id || order.customerId;
          } else {
            // Normal case: use asal_bahan_id or asal_bahan directly
            originCustomerId = order.asal_bahan_id || order.asal_bahan;
          }
          
          if (originCustomerId) {
            const originData = await db.$queryRaw`
              SELECT id, nama FROM customer WHERE id = ${originCustomerId}
            `;
            
            if (Array.isArray(originData) && originData.length > 0) {
              originCustomer = {
                id: originData[0].id.toString(),
                nama: originData[0].nama
              };
            }
          }
        } catch (error) {
          console.error('Error fetching origin customer:', error);
        }
      }
      
      return {
        ...order,
        // Include marketing user data
        marketingUser,
        // Keep the old marketingInfo for backward compatibility
        marketingInfo: marketingUser || (order.marketing ? { name: order.marketing } : null),
        // Include designer user data
        designer_id,
        // Include fabric origin customer data
        originCustomer,
        // Override customer with fetched data if available
        customer: customerData
      };
    }));

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
    console.log("[API] Creating order with data:", data);

    // Determine product type and handle PRESS ONLY case
    let productType = "SUBLIM"; // Default value
    let isPressOnly = false;
    
    if (data.tipe_produk) {
      productType = data.tipe_produk;
    } else if (data.jenisProduk) {
      // Check if this is a PRESS ONLY order
      isPressOnly = data.jenisProduk.PRESS && 
        !data.jenisProduk.PRINT && 
        !data.jenisProduk.CUTTING && 
        !data.jenisProduk.DTF && 
        !data.jenisProduk.SEWING;
        
      if (data.jenisProduk.DTF) {
        productType = "DTF";
      } else if (data.jenisProduk.SUBLIM) {
        productType = "SUBLIM";
      } else if (data.jenisProduk.PRINT) {
        productType = "PRINT";
      } else if (data.jenisProduk.CUTTING) {
        productType = "CUTTING";
      } else if (data.jenisProduk.PRESS) {
        productType = "PRESS";
      } else {
        const firstSelectedType = Object.entries(data.jenisProduk)
          .find(([_, selected]) => selected);
        if (firstSelectedType) {
          productType = firstSelectedType[0];
        }
      }
    }

    // Generate SPK number in MMYYNNN format
    let nextSpkNumber = 1;
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const prefix = `${month}${year}`;

    try {
      // Find the latest SPK number for the current month and year
      const latestOrder = await db.order.findFirst({
        where: {
          spk: {
            startsWith: prefix
          }
        },
        orderBy: {
          spk: 'desc'
        },
        select: {
          spk: true
        }
      });

      if (latestOrder?.spk) {
        // Extract the sequence number and increment
        const sequence = parseInt(latestOrder.spk.slice(-3), 10);
        if (!isNaN(sequence)) {
          nextSpkNumber = sequence + 1;
        }
      }
    } catch (error) {
      console.error("Error finding next SPK number:", error);
    }

    // Format SPK number with MMYYNNN format
    const spkNumber = `${prefix}${nextSpkNumber.toString().padStart(3, '0')}`;

    // Convert quantity from yards to meters if needed
    const quantity = data.unit === "yard" 
      ? yardToMeter(parseFloat(data.jumlah || "0")).toString()
      : data.jumlah;
    console.log("[API] Converted quantity:", quantity, "from unit:", data.unit);

    // Process additional costs
    const additionalCosts = data.additionalCosts || [];
    // Prepare additional costs mappings
    const additionalCostFields: Record<string, any> = {};

    additionalCosts.forEach((cost: { item?: string; pricePerUnit?: string; unitQuantity?: string; total?: string }, index: number) => {
      if (index === 0) {
        additionalCostFields.tambah_cutting = cost.item || "";
        additionalCostFields.satuan_cutting = cost.pricePerUnit || "";
        additionalCostFields.qty_cutting = cost.unitQuantity || "";
        additionalCostFields.total_cutting = cost.total || "";
      } else if (index < 6) { // Up to 5 additional costs
        additionalCostFields[`tambah_cutting${index}`] = cost.item || "";
        additionalCostFields[`satuan_cutting${index}`] = cost.pricePerUnit || "";
        additionalCostFields[`qty_cutting${index}`] = cost.unitQuantity || "";
        additionalCostFields[`total_cutting${index}`] = cost.total || "";
      }
    });

    // Map matching color value
    const matchingColorValue = data.matchingColor === "YES" ? "ADA" : "TIDAK ADA";

    // Map discount value
    let discount = "0";
    if (data.discountType === "fixed" && data.discountValue) {
      discount = data.discountValue;
    } else if (data.discountType === "percentage" && data.discountValue) {
      // Store percentage value as is
      discount = `${data.discountValue}%`;
    }
    console.log("[API] Discount set to:", discount, "from type:", data.discountType, "value:", data.discountValue);

    // Process customerId
    console.log("[API] Processing Customer ID:", data.customerId, "Type:", typeof data.customerId);
    let customerIdValue = null;
    try {
      if (data.customerId) {
        customerIdValue = BigInt(data.customerId);
        console.log("[API] Converted Customer ID to BigInt:", customerIdValue.toString());
      }
    } catch (error) {
      console.error("[API] Error converting customerId to BigInt:", error);
    }

    // Process asalBahanId
    console.log("[API] Processing Asal Bahan - ID:", data.asalBahanId, "Name:", data.asalBahan);

    // Check if this is a DTF order
    const isDtfOrder = data.jenisProduk?.DTF === true || productType === "DTF";
    console.log("[API] Is DTF order:", isDtfOrder);

    // Create order in database with correct status for PRESS ONLY orders
    const baseOrderData = {
      // Use the processed customerIdValue
      customerId: customerIdValue,
      spk: spkNumber,
      marketing: data.marketing,
      statusprod: data.statusProduksi, // NEW or REPEAT
      kategori: data.kategori,
      est_order: data.targetSelesai, // Target completion date
      designer_id: data.designer_id,
      // For DTF orders, clear all fabric-related fields
      nama_kain: isDtfOrder ? "" : (data.namaBahan || ""),
      jumlah_kain: isDtfOrder ? "" : (data.selectedFabric?.length || data.fabricLength || ""),
      lebar_kain: isDtfOrder ? "" : (data.lebarKain || ""),
      nama_produk: data.aplikasiProduk || "",
      gramasi: data.gsmKertas || "",
      lebar_kertas: data.lebarKertas || "",
      lebar_file: data.fileWidth || "",
      warna_acuan: matchingColorValue,
      produk: typeof data.jenisProduk === 'string' 
        ? data.jenisProduk
        : Object.entries(data.jenisProduk || {})
            .filter(([_, selected]) => selected)
            .map(([type]) => type)
            .join(", "),
      tipe_produk: productType,
      path: data.fileDesain || "",
      qty: quantity,
      panjang_order: quantity,
      harga_satuan: data.harga || "",
      tambah_cutting: data.tambah_cutting || "",
      satuan_cutting: data.satuan_cutting || "",
      qty_cutting: data.qty_cutting || "",
      total_cutting: data.total_cutting || "",
      tambah_bahan: data.tax ? `Tax: ${data.taxPercentage}%` : null,
      diskon: discount,
      nominal: data.totalPrice || "",
      catatan: data.notes || "",
      statusm: isPressOnly ? "PRODUCTION" : "DESIGN",
      status: isPressOnly ? "READYFORPROD" : "PENDING",
      userId: session.user.id,
      keterangan: "BELUM DIINVOICEKAN",
      created_at: new Date(),
      prioritas: data.priority ? "YES" : "NO",
      no_project: data.projectNumber || "",
      // Include additional costs fields 1-5
      tambah_cutting1: data.tambah_cutting1 || null,
      satuan_cutting1: data.satuan_cutting1 || null,
      qty_cutting1: data.qty_cutting1 || null,
      total_cutting1: data.total_cutting1 || null,
      tambah_cutting2: data.tambah_cutting2 || null,
      satuan_cutting2: data.satuan_cutting2 || null,
      qty_cutting2: data.qty_cutting2 || null,
      total_cutting2: data.total_cutting2 || null,
      tambah_cutting3: data.tambah_cutting3 || null,
      satuan_cutting3: data.satuan_cutting3 || null,
      qty_cutting3: data.qty_cutting3 || null,
      total_cutting3: data.total_cutting3 || null,
      tambah_cutting4: data.tambah_cutting4 || null,
      satuan_cutting4: data.satuan_cutting4 || null,
      qty_cutting4: data.qty_cutting4 || null,
      total_cutting4: data.total_cutting4 || null,
      tambah_cutting5: data.tambah_cutting5 || null,
      satuan_cutting5: data.satuan_cutting5 || null,
      qty_cutting5: data.qty_cutting5 || null,
      total_cutting5: data.total_cutting5 || null,
      // Add the unit field as satuan_bahan
      satuan_bahan: data.unit,
      // Add asal_bahan_id if it exists
      ...(data.asalBahanId ? { asal_bahan_id: BigInt(data.asalBahanId) } : {})
    };

    // Use a transaction to ensure SPK uniqueness during order creation
    const order = await db.$transaction(async (tx) => {
      // First, check if an order with this SPK already exists
      const existingOrder = await tx.order.findFirst({
        where: {
          spk: baseOrderData.spk
        }
      });

      if (existingOrder) {
        throw new Error(`An order with SPK ${baseOrderData.spk} already exists. Please generate a new SPK.`);
      }

      // Create the order with the correct relation syntax
      const createdOrder = await tx.order.create({
        data: {
          ...baseOrderData,
          asal_bahan_id: data.asalBahanId ? BigInt(data.asalBahanId) : undefined
        },
        include: {
          customer: true,
          user: true,
          asal_bahan_rel: true
        }
      });

      // Delete the temporary SPK reservation since it's now being used
      try {
        await tx.tempSpkReservation.deleteMany({
          where: {
            spk: baseOrderData.spk
          }
        });
        console.log(`[API] Removed temporary reservation for SPK: ${baseOrderData.spk}`);
      } catch (error) {
        console.error(`[API] Error removing temporary SPK reservation: ${error}`);
        // Non-critical, continue with the transaction
      }

      return createdOrder;
    }, {
      // Longer timeout for complex transactions
      timeout: 15000
    });

    // Log the created order for debugging
    console.log("[API] Created order with status:", {
      statusm: order.statusm,
      status: order.status,
      isPressOnly,
      productType
    });

    return NextResponse.json({
        success: true,
        message: "Order created successfully",
        order: serializeOrderData(order),
        projectNumber: data.projectNumber || ""
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}