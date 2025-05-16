import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// Generate fallback repeat order data for a customer
function generateFallbackRepeatOrders(customerId: string) {
  // Generate some dates in the past
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);
  
  const twentyDaysAgo = new Date(today);
  twentyDaysAgo.setDate(today.getDate() - 20);
  
  // Month and year for SPK numbers
  const getMonthYear = (date: Date) => {
    return `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
  };
  
  return [
    {
      spk: `${getMonthYear(threeDaysAgo)}1001`,
      orderDate: threeDaysAgo.toISOString(),
      details: "Product: Print Material | Type: PRINT, PRESS | Quantity: 25 | Fabric: Cotton 100%",
      orderData: {
        id: "1",
        spk: `${getMonthYear(threeDaysAgo)}1001`,
        tanggal: threeDaysAgo.toISOString(),
        produk: "Print Material",
        jenisProduk: { PRINT: true, PRESS: true, CUTTING: false, DTF: false, SEWING: false },
        jumlah: "25",
        notes: "",
        gsmKertas: "120",
        lebarKertas: "145 cm",
        fileWidth: "140 cm",
        namaBahan: "Cotton 100%",
        asalBahan: "CUSTOMER",
        hargaSatuan: "35000",
        totalHarga: "875000",
        created_at: threeDaysAgo.toISOString()
      }
    },
    {
      spk: `${getMonthYear(tenDaysAgo)}0892`,
      orderDate: tenDaysAgo.toISOString(),
      details: "Product: Banner | Type: PRINT, PRESS, CUTTING | Quantity: 15 | Fabric: Polyester Blend",
      orderData: {
        id: "2",
        spk: `${getMonthYear(tenDaysAgo)}0892`,
        tanggal: tenDaysAgo.toISOString(),
        produk: "Banner",
        jenisProduk: { PRINT: true, PRESS: true, CUTTING: true, DTF: false, SEWING: false },
        jumlah: "15",
        notes: "",
        gsmKertas: "150",
        lebarKertas: "160 cm",
        fileWidth: "155 cm",
        namaBahan: "Polyester Blend",
        asalBahan: "SMARTONE",
        hargaSatuan: "45000",
        totalHarga: "675000",
        created_at: tenDaysAgo.toISOString()
      }
    },
    {
      spk: `${getMonthYear(twentyDaysAgo)}0765`,
      orderDate: twentyDaysAgo.toISOString(),
      details: "Product: DTF Transfer | Type: DTF | Quantity: 10 | GSM: 100",
      orderData: {
        id: "3",
        spk: `${getMonthYear(twentyDaysAgo)}0765`,
        tanggal: twentyDaysAgo.toISOString(),
        produk: "DTF Transfer",
        jenisProduk: { PRINT: false, PRESS: false, CUTTING: false, DTF: true, SEWING: false },
        jumlah: "10",
        notes: "",
        gsmKertas: "100",
        lebarKertas: "110 cm",
        fileWidth: "105 cm",
        namaBahan: "",
        asalBahan: "CUSTOMER",
        hargaSatuan: "55000",
        totalHarga: "550000",
        created_at: twentyDaysAgo.toISOString()
      }
    }
  ];
}

// GET: Fetch repeat orders for a specific customer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get previous orders for the customer
    const orders = await prisma.order.findMany({
      where: {
        customerId: parseInt(customerId),
      },
      select: {
        spk: true,
        tanggal: true,
        keterangan: true,
      },
      orderBy: {
        tanggal: 'desc',
      },
      take: 20, // Limit to 20 most recent orders
    });

    // Format orders as repeat order options
    const repeatOrders = orders.map(order => ({
      spk: order.spk || '',
      orderDate: order.tanggal ? order.tanggal.toISOString().split('T')[0] : 'N/A',
      details: order.keterangan || 'No details available',
    }));

    return NextResponse.json(serializeData(repeatOrders));
  } catch (error) {
    console.error('Error fetching repeat orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repeat orders' },
      { status: 500 }
    );
  }
}

// Helper function to format order details for display
function formatOrderDetails(order: any): string {
  const details = [];
  
  if (order.produk) details.push(`Product: ${order.produk}`);
  if (order.jenisProduk) {
    // Handle different jenisProduk formats (string or object)
    if (typeof order.jenisProduk === 'string') {
      details.push(`Type: ${order.jenisProduk}`);
    } else if (typeof order.jenisProduk === 'object') {
      const types = Object.entries(order.jenisProduk)
        .filter(([_, isSelected]) => !!isSelected)
        .map(([type]) => type);
      
      if (types.length > 0) {
        details.push(`Type: ${types.join(', ')}`);
      }
    }
  }
  
  if (order.jumlah) details.push(`Quantity: ${order.jumlah}`);
  if (order.namaBahan) details.push(`Fabric: ${order.namaBahan}`);
  if (order.gsmKertas) details.push(`GSM: ${order.gsmKertas}`);
  
  return details.join(' | ');
} 