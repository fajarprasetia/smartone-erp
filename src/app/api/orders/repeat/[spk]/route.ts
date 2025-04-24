import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to handle serialization of data (including BigInt)
const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(
      data,
      (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: { spk: string } }
) {
  try {
    const spk = params.spk;

    if (!spk) {
      return NextResponse.json(
        { error: 'SPK parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching repeat order for SPK: ${spk}`);

    // Find the order by SPK - Try to match exactly or with string conversion
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { spk: { equals: spk } },
          { spk: { equals: spk.toString() } }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!order) {
      console.log(`Order not found for SPK: ${spk}`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`Found order with ID: ${order.id}`);

    // Define default product types object with all fields required by the form schema
    const productTypes = {
      PRINT: false,
      PRESS: false,
      CUTTING: false,
      DTF: false,
      SEWING: false,
    };
    
    let dtfPass: string | undefined = undefined;

    // Try to parse product types from the order data
    if (order.tipe_produk) {
      const typesList = order.tipe_produk.split(",").map(t => t.trim());
      
      // Check for DTF with pass info
      const dtfType = typesList.find(t => t.startsWith("DTF"));
      if (dtfType) {
        productTypes.DTF = true;
        // Extract pass info if available (format: "DTF (4 PASS)" or "DTF (6 PASS)")
        const passMatch = dtfType.match(/DTF \((\d+ PASS)\)/);
        if (passMatch && passMatch[1]) {
          dtfPass = passMatch[1];
        }
      }
      
      // Set other product types
      if (typesList.includes("PRINT")) productTypes.PRINT = true;
      if (typesList.includes("PRESS")) productTypes.PRESS = true;
      if (typesList.includes("CUTTING")) productTypes.CUTTING = true;
      if (typesList.includes("SEWING")) productTypes.SEWING = true;
    }

    // Format order to match expected fields in the form schema
    const formattedOrder = {
      // Required fields for the order form
      customerId: order.customerId?.toString() || "",
      spk: order.spk || "",
      jenisProduk: productTypes,
      jumlah: order.panjang_order?.toString() || order.qty?.toString() || "",
      unit: (order as any).unit || "meter",
      asalBahan: order.asal_bahan_id?.toString() || (order as any).asal_bahan?.toString() || "",
      statusProduksi: "REPEAT" as const,
      kategori: "REGULAR ORDER" as const,
      targetSelesai: order.est_order || new Date(),
      namaBahan: order.nama_kain || "",
      aplikasiProduk: (order as any).aplikasi || "",
      gsmKertas: order.gramasi?.toString() || "",
      lebarKertas: order.lebar_kertas || "",
      fileWidth: order.lebar_file || "",
      matchingColor: order.warna_acuan === "YES" ? "YES" as const : "NO" as const,
      notes: order.keterangan || order.catatan || "",
      harga: order.nominal?.toString() || order.harga_satuan?.toString() || "",
      discountType: "none" as const,
      discountValue: "",
      tax: false,
      totalPrice: "",
      fileDesain: order.path || "",
      marketing: order.marketing || "",
      priority: false,
      additionalCosts: [],
      
      // Extra fields not part of the schema but useful for the UI
      customerName: order.customer?.nama || "",
      tanggal: order.tanggal,
      id: order.id.toString(),
    };

    // Only add optional fields if they have values
    if (dtfPass) {
      (formattedOrder as any).dtfPass = dtfPass as "4 PASS" | "6 PASS";
    }

    console.log("Returning repeat order data:", formattedOrder);
    return NextResponse.json(serializeData(formattedOrder));
  } catch (error) {
    console.error('Error fetching repeat order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch repeat order',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 