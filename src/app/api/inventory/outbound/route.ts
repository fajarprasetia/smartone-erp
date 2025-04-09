import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Fetch orders with approval_barang set to "APPROVED" and status not "DISERAHKAN"
    const ordersRaw = await prisma.$queryRaw`
      SELECT o.*, c.nama as customer_name
      FROM "Order" o
      LEFT JOIN "customer" c ON o.customer_id = c.id
      WHERE o.approval_barang = 'APPROVED' 
      AND o.status != 'DISERAHKAN'
      ORDER BY o.id DESC
    `;

    // Process orders to include customer info in a more structured way
    const orders = Array.isArray(ordersRaw) 
      ? ordersRaw.map((order: any) => ({
          ...order,
          customer: order.customer_id ? {
            id: order.customer_id,
            name: order.customer_name || 'Unknown'
          } : null
        }))
      : [];

    return NextResponse.json(orders);
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
    
    let result;
    
    try {
      if (action === 'handover') {
        // Update order status to "DISERAHKAN"
        result = await prisma.$queryRaw`
          UPDATE "Order"
          SET status = 'DISERAHKAN', statusm = 'DISERAHKAN'
          WHERE id = ${id}
          RETURNING *
        `;
      } else if (action === 'reject_qc') {
        // Update order status for rejected QC
        result = await prisma.$queryRaw`
          UPDATE "Order"
          SET approval_barang = 'REJECTED'
          WHERE id = ${id}
          RETURNING *
        `;
      }
      
      const updatedOrder = Array.isArray(result) && result.length > 0 
        ? result[0] 
        : null;
      
      if (!updatedOrder) {
        return NextResponse.json(
          { error: `Order with ID ${id} not found or not updated` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(updatedOrder);
    } catch (queryError) {
      console.error('Database error when updating order:', queryError);
      return NextResponse.json(
        { error: `Database error: ${queryError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
} 