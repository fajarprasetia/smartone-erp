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

    // Improve the project number generation with better querying and error handling
    // Generate project number (SO-XXXXXXXX format)
    let nextProjectNumber = 1;
    try {
      // Find the most recent order by project number
      const latestOrders = await db.order.findMany({
        where: {
          no_project: {
            startsWith: 'SO-',
            not: null
          }
        },
        orderBy: {
          no_project: 'desc'
        },
        take: 10,
        select: {
          no_project: true
        }
      });
      
      console.log(`[API] Found ${latestOrders.length} latest orders with project numbers`);
      
      // Analyze each of the latest orders to find the highest number
      if (latestOrders.length > 0) {
        let highestNumber = 0;
        
        for (const order of latestOrders) {
          if (!order.no_project) continue;
          
          const match = order.no_project.match(/SO-(\d+)/);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > highestNumber) {
              highestNumber = num;
            }
          }
        }
        
        if (highestNumber > 0) {
          nextProjectNumber = highestNumber + 1;
          console.log(`[API] Found highest project number: ${highestNumber}, incrementing to ${nextProjectNumber}`);
        } else {
          console.log(`[API] Could not find valid project numbers among the latest orders`);
        }
      } else {
        console.log(`[API] No existing project numbers found, starting at 1`);
      }
    } catch (error) {
      console.error(`[API] Error finding latest project number:`, error);
    }
    
    // Format with 8 digits, padded with zeros
    const projectNumber = `SO-${nextProjectNumber.toString().padStart(8, '0')}`;
    console.log(`[API] Generated project number: ${projectNumber}`);

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

    // Determine product type
    let productType = "SUBLIM"; // Default value
    if (data.tipe_produk) {
      // Use directly provided tipe_produk value if available
      console.log("[API] Using explicit tipe_produk:", data.tipe_produk);
      productType = data.tipe_produk;
    } else if (data.jenisProduk?.DTF) {
      productType = "DTF";
    } else if (data.jenisProduk) {
      // Check other product types in order of priority
      if (data.jenisProduk.SUBLIM) {
        productType = "SUBLIM";
      } else if (data.jenisProduk.PRINT) {
        productType = "PRINT";
      } else if (data.jenisProduk.CUTTING) {
        productType = "CUTTING";
      } else if (data.jenisProduk.PRESS) {
        productType = "PRESS";
      } else {
        // If none of the specific types match, use the first true value
        const firstSelectedType = Object.entries(data.jenisProduk)
          .find(([_, selected]) => selected);
        if (firstSelectedType) {
          productType = firstSelectedType[0];
        }
      }
    }
    console.log("[API] Product type determined as:", productType, "from jenisProduk:", JSON.stringify(data.jenisProduk));

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

    // Prepare order data
    let orderData: any = {
      // Use the processed customerIdValue
      customerId: customerIdValue,
      spk: data.spk,
      marketing: data.marketing,
      statusprod: data.statusProduksi, // NEW or REPEAT
      kategori: data.kategori,
      est_order: data.targetSelesai, // Target completion date
      designer_id: data.designer_id,
      // For DTF orders, clear all fabric-related fields
      nama_kain: isDtfOrder ? "" : (data.namaBahan || ""),
      jumlah_kain: isDtfOrder ? "" : (data.selectedFabric?.length || data.fabricLength || ""), // Use fabric length from the form
      lebar_kain: isDtfOrder ? "" : (data.lebarKain || ""), // Fabric width
      nama_produk: data.aplikasiProduk || "", // Product application
      gramasi: data.gsmKertas || "", // Paper GSM
      lebar_kertas: data.lebarKertas || "", // Paper width
      lebar_file: data.fileWidth || "", // File width
      warna_acuan: matchingColorValue, // YES -> ADA, NO -> TIDAK ADA
      
      // Process the product types correctly - for historical reasons, this needs to be the string of keys
      produk: typeof data.jenisProduk === 'string' 
        ? data.jenisProduk // Use directly if it's already a string (old format)
        : Object.entries(data.jenisProduk || {})
            .filter(([_, selected]) => selected)
            .map(([type]) => type)
            .join(", "), // Selected product types as comma-separated string
            
      tipe_produk: productType, // Store the determined product type
      path: data.fileDesain || "", // Design file URL
      qty: quantity, // Quantity in meters
      panjang_order: quantity, // Same as qty
      harga_satuan: data.harga || "", // Unit price
      // Additional costs
      ...additionalCostFields,
      // Store tax percentage in tambah_bahan field if tax is applied
      tambah_bahan: data.tax ? `Tax: ${data.taxPercentage}%` : null,
      // Discount
      diskon: discount,
      nominal: data.totalPrice || "", // Total price
      catatan: data.notes || "", // Notes
      statusm: "DESIGN", // Default status for marketing
      status: "PENDING", // Default status for production
      userId: session.user.id, // User who created the order
      keterangan: "BELUM DIINVOICEKAN", // Default invoice status
      created_at: new Date(), // Current timestamp
      prioritas: data.priority ? "YES" : "NO", // Priority status
      no_project: projectNumber, // Generated project number
      // For DTF orders, add DTF pass information to notes if not already there
      ...(isDtfOrder && data.dtfPass && !data.notes?.includes(data.dtfPass) ? {
        catatan: `${data.notes ? data.notes + ", " : ""}${data.dtfPass}`
      } : {})
    };

    // Handle fabric origin (asal_bahan) based on the selection
    console.log("[API] Processing fabric origin - asalBahan:", data.asalBahan, "customerId:", data.customerId);

    // If asalBahan is SMARTONE, set asal_bahan_rel as relation
    if (data.asalBahan === "SMARTONE") {
      orderData.asalBahanRelId = "22";
      console.log("[API] Set asal_bahan_rel to 22 for SMARTONE fabric origin");
    }
    // If asalBahan is CUSTOMER, use the customer's ID
    else if (data.asalBahan === "CUSTOMER" && data.customerId) {
      orderData.asalBahanRelId = data.customerId.toString();
      console.log("[API] Set asal_bahan_rel to customer ID:", data.customerId);
    }
    // Handle legacy or alternative field names
    else if (data.asalBahanId) {
      orderData.asalBahanRelId = data.asalBahanId.toString();
      console.log("[API] Set asal_bahan_rel using asalBahanId:", data.asalBahanId);
    }

    if (isDtfOrder) {
      console.log("[API] DTF order detected: fabric origin will still be saved");
    }

    console.log("[API] Final order data for creation:", JSON.stringify(orderData, (key, value) => 
      typeof value === "bigint" ? value.toString() : value
    ));

    // Use a transaction to ensure SPK uniqueness during order creation
    const result = await db.$transaction(async (tx) => {
      // First, check if an order with this SPK already exists
      const existingOrder = await tx.order.findFirst({
        where: {
          spk: orderData.spk
        }
      });

      if (existingOrder) {
        throw new Error(`An order with SPK ${orderData.spk} already exists. Please generate a new SPK.`);
      }

      // Create order in database
      const order = await tx.order.create({
        data: {
          // Use 'customer' with connect rather than 'customerId'
          customer: customerIdValue ? {
            connect: { id: customerIdValue }
          } : undefined,
          
          // Other fields
          spk: orderData.spk,
          marketing: orderData.marketing,
          designer_id: orderData.designer_id,
          statusprod: orderData.statusprod,
          kategori: orderData.kategori,
          est_order: orderData.est_order,
          nama_kain: orderData.nama_kain,
          jumlah_kain: orderData.jumlah_kain,
          lebar_kain: orderData.lebar_kain,
          nama_produk: orderData.nama_produk,
          gramasi: orderData.gramasi,
          lebar_kertas: orderData.lebar_kertas,
          lebar_file: orderData.lebar_file,
          warna_acuan: orderData.warna_acuan,
          produk: orderData.produk,
          tipe_produk: orderData.tipe_produk,
          path: orderData.path,
          qty: orderData.qty,
          panjang_order: orderData.panjang_order,
          harga_satuan: orderData.harga_satuan,
          tambah_cutting: orderData.tambah_cutting,
          satuan_cutting: orderData.satuan_cutting,
          qty_cutting: orderData.qty_cutting,
          total_cutting: orderData.total_cutting,
          tambah_bahan: orderData.tambah_bahan,
          diskon: orderData.diskon,
          nominal: orderData.nominal,
          catatan: orderData.catatan,
          statusm: orderData.statusm,
          status: orderData.status,
          
          // Use direct connection for user
          user: {
            connect: { id: session.user.id }
          },
          
          keterangan: orderData.keterangan,
          created_at: orderData.created_at,
          prioritas: orderData.prioritas,
          no_project: orderData.no_project,
          
          // Handle asal_bahan_rel correctly using relation syntax
          asal_bahan_rel: orderData.asalBahanRelId ? {
            connect: { id: BigInt(orderData.asalBahanRelId) }
          } : undefined,
          
          // Include additional costs fields 1-5
          tambah_cutting1: orderData.tambah_cutting1 || null,
          satuan_cutting1: orderData.satuan_cutting1 || null,
          qty_cutting1: orderData.qty_cutting1 || null,
          total_cutting1: orderData.total_cutting1 || null,
          tambah_cutting2: orderData.tambah_cutting2 || null,
          satuan_cutting2: orderData.satuan_cutting2 || null,
          qty_cutting2: orderData.qty_cutting2 || null,
          total_cutting2: orderData.total_cutting2 || null,
          tambah_cutting3: orderData.tambah_cutting3 || null,
          satuan_cutting3: orderData.satuan_cutting3 || null,
          qty_cutting3: orderData.qty_cutting3 || null,
          total_cutting3: orderData.total_cutting3 || null,
          tambah_cutting4: orderData.tambah_cutting4 || null,
          satuan_cutting4: orderData.satuan_cutting4 || null,
          qty_cutting4: orderData.qty_cutting4 || null,
          total_cutting4: orderData.total_cutting4 || null,
          tambah_cutting5: orderData.tambah_cutting5 || null,
          satuan_cutting5: orderData.satuan_cutting5 || null,
          qty_cutting5: orderData.qty_cutting5 || null,
          total_cutting5: orderData.total_cutting5 || null,
          // Add the unit field as satuan_bahan
          satuan_bahan: data.unit
        }
      });

      // Delete the temporary SPK reservation since it's now being used
      try {
        await tx.tempSpkReservation.deleteMany({
          where: {
            spk: orderData.spk
          }
        });
        console.log(`[API] Removed temporary reservation for SPK: ${orderData.spk}`);
      } catch (error) {
        console.error(`[API] Error removing temporary SPK reservation: ${error}`);
        // Non-critical, continue with the transaction
      }

      console.log(`[API] Created order with ID: ${order.id}`);
      return order;
    }, {
      // Longer timeout for complex transactions
      timeout: 15000
    });

    return NextResponse.json({
        success: true,
        message: "Order created successfully",
        order: serializeOrderData(result),
        projectNumber: projectNumber
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