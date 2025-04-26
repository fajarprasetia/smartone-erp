import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock data for outbound orders
const generateMockOutboundOrders = () => {
  const statuses = ['COMPLETED', 'DELIVERY'];
  const approvalStatuses = ['APPROVED', 'PENDING', 'REJECTED'];
  const customers = [
    { id: 1, name: 'PT Maju Bersama' },
    { id: 2, name: 'CV Sukses Jaya' },
    { id: 3, name: 'UD Makmur Sentosa' },
    { id: 4, name: 'PT Teknologi Maju' },
    { id: 5, name: 'CV Berkah Abadi' }
  ];
  const products = [
    'T-Shirt Polos',
    'Kemeja Formal',
    'Celana Jeans',
    'Polo Shirt Premium',
    'Kaos Custom',
    'Jaket Hoodie',
    'Topi Snapback',
    'Sweater Cotton'
  ];

  const mockOrders = [];

  // Generate 15 mock orders
  for (let i = 1; i <= 15; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const statusm = statuses[Math.floor(Math.random() * statuses.length)];
    // For demo purposes, make most orders APPROVED
    const approval_barang = i <= 10 ? 'APPROVED' : approvalStatuses[Math.floor(Math.random() * approvalStatuses.length)];
    
    // Create a date between 1-30 days ago
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30) - 1);
    
    // Only orders with COMPLETED status and APPROVED approval should be included in outbound list
    if (i <= 12) { // Make most orders qualify for outbound
      mockOrders.push({
        id: `ORD-${2023}-${1000 + i}`,
        spk: `SPK-${2023}-${1000 + i}`,
        tanggal: randomDate.toISOString(),
        produk: product,
        customer_id: customer.id,
        customer: {
          id: customer.id,
          name: customer.name
        },
        statusm: 'DELIVERY', // For most outbound orders, set to DELIVERY
        status: 'COMPLETED',
        approval_barang: 'APPROVED', // For most outbound orders, set to APPROVED
        jumlah: Math.floor(Math.random() * 50) + 10,
        harga: Math.floor(Math.random() * 100000) + 50000
      });
    }
  }

  return mockOrders;
};

// Generate the mock data once
const mockOutboundOrders = generateMockOutboundOrders();

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      return value;
    })
  );
}

export async function GET(req: NextRequest) {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch orders with DTF done (not null), and approved
    const orders = await db.order.findMany({
      where: {
        dtf_done: { not: null },
        OR: [
          { statusm: 'DELIVERY' },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            nama: true,
          }
        }
      },
      orderBy: {
        tanggal: 'desc'
      }
    });
    
    return NextResponse.json(serializeData(orders));
  } catch (error) {
    console.error('Error fetching outbound orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outbound orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, action } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    if (!action || !['handover', 'reject_qc'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required: handover or reject_qc' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    let updatedOrder;
    
    if (action === 'handover') {
      updatedOrder = await db.order.update({
        where: { id },
        data: {
          statusm: 'DISERAHKAN',
          status: 'DISERAHKAN',
          penyerahan_id: session.user.id,
          updated_at: now
        },
        include: {
          customer: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      });
      
      // Log the handover action
      await db.orderLog.create({
        data: {
          orderId: id,
          userId: session.user.id,
          action: 'HANDOVER',
          notes: 'Order handed over to customer',
          timestamp: now
        }
      });
    } else if (action === 'reject_qc') {
      updatedOrder = await db.order.update({
        where: { id },
        data: {
          approval_barang: 'REJECTED',
          updated_at: now
        },
        include: {
          customer: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      });
      
      // Log the rejection action
      await db.orderLog.create({
        data: {
          orderId: id,
          userId: session.user.id,
          action: 'REJECT_QC',
          notes: 'Quality check rejected',
          timestamp: now
        }
      });
    }
    
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(serializeData(updatedOrder));
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}