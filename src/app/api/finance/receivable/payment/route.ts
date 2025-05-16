import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function GET(req: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchQuery = searchParams.get('search') || '';
    const includeOrderDetails = searchParams.get('includeOrderDetails') === 'true';
    
    // Validation
    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Find all orders with payments (either down payment or final payment)
    // Build proper Prisma-compatible where conditions
    const baseWhereCondition: any = {
      OR: [
        { 
          tgl_dp: { not: null },
          dp: { not: null }
        },
        { 
          tgl_lunas: { not: null }
        }
      ]
    };
    
    // Add search condition if needed
    if (searchQuery) {
      baseWhereCondition.OR = [
        ...baseWhereCondition.OR,
        { 
          invoice: { contains: searchQuery }
        },
        { 
          spk: { contains: searchQuery }
        },
        { 
          customer: {
            nama: { contains: searchQuery }
          }
        }
      ];
    }
    
    // Count total records for pagination
    const totalCount = await db.order.count({
      where: baseWhereCondition
    });
    
    // Fetch orders with payments
    const orders = await db.order.findMany({
      where: baseWhereCondition,
      include: {
        customer: true
      },
      skip,
      take: pageSize,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Transform data into transactions format
    const transactions: any[] = [];
    
    for (const order of orders) {
      // Add down payment transaction if exists
      if (order.tgl_dp && order.dp) {
        transactions.push({
          id: `dp-${order.id}`,
          invoiceNumber: order.invoice || `INV-${order.spk || order.id}`,
          customerName: order.customer?.nama || 'Unknown',
          amount: parseFloat(order.dp),
          date: order.tgl_dp,
          paymentMethod: order.jenis_pembayaran || "CASH",
          status: "COMPLETED",
          description: `Down payment for order ${order.spk || order.id}`,
          notes: order.catatan_tf || null,
          receiptUrl: order.tf_dp || null,
          orderId: order.id,
          // Add order details for SPK and invoice display
          order: {
            id: order.id,
            spk: order.spk,
            invoice: order.invoice
          }
        });
      }
      
      // Add final payment transaction if exists
      if (order.tgl_lunas) {
        const downPaymentAmount = order.dp ? parseFloat(order.dp) : 0;
        const totalAmount = order.nominal ? parseFloat(order.nominal) : 0;
        const finalPaymentAmount = totalAmount - downPaymentAmount;
        
        if (finalPaymentAmount > 0) {
          transactions.push({
            id: `final-${order.id}`,
            invoiceNumber: order.invoice || `INV-${order.spk || order.id}`,
            customerName: order.customer?.nama || 'Unknown',
            amount: finalPaymentAmount,
            date: order.tgl_lunas,
            paymentMethod: order.jenis_pembayaran || "CASH",
            status: "COMPLETED",
            description: `Final payment for order ${order.spk || order.id}`,
            notes: order.catatan_tf || null,
            receiptUrl: order.tf_pelunasan || null,
            orderId: order.id,
            // Add order details for SPK and invoice display
            order: {
              id: order.id,
              spk: order.spk,
              invoice: order.invoice
            }
          });
        }
      }
    }
    
    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return NextResponse.json(serializeData({
      transactions,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      }
    }));
    
  } catch (error: any) {
    console.error("Error fetching payment history:", error);
    
    return NextResponse.json(
      {
        error: "Failed to fetch payment history",
        details: error.message || "Unknown error occurred"
      },
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
    const { orderId, amount, paymentDate, paymentMethod, notes, receiptPath, invoiceNumber } = data;
    
    if (!orderId || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json(
        { error: "Invalid request data. Order ID and valid payment amount are required." },
        { status: 400 }
      );
    }
    
    // Start a transaction to ensure data consistency
    return await db.$transaction(async (tx) => {
      // Get the order
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });
      
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Calculate payment amount
      const paymentAmount = parseFloat(amount);
      const totalAmount = order.nominal ? parseFloat(order.nominal) : 0;
      
      // Determine if this is a down payment or a full payment
      const isPaid = order.tgl_lunas !== null;
      const hasDownPayment = order.tgl_dp !== null && order.dp !== null;
      const downPaymentAmount = hasDownPayment ? parseFloat(order.dp || '0') : 0;
      
      // Create update data for the order
      const updateData: any = {};
      
      // Set the invoice number if provided and not already set
      if (invoiceNumber && (!order.invoice || order.invoice.startsWith('INV-'))) {
        updateData.invoice = invoiceNumber;
        updateData.tgl_invoice = new Date(paymentDate || new Date());
      }
      
      // Update status to DELIVERY and approve goods when payment is recorded
      updateData.statusm = "DELIVERY";
      updateData.approval_barang = "APPROVED";
      
      // If order is already paid, we shouldn't allow more payments
      if (isPaid) {
        throw new Error("Order is already fully paid");
      }
      
      // If there's no down payment yet, record this as down payment
      if (!hasDownPayment) {
        updateData.tgl_dp = new Date(paymentDate || new Date());
        updateData.dp = paymentAmount.toString();
        updateData.jenis_pembayaran = paymentMethod || "CASH";
        updateData.tf_dp = receiptPath;
        updateData.catatan_tf = notes;
        
        // Calculate remaining amount
        updateData.sisa = (totalAmount - paymentAmount).toString();
        
        // If the payment equals the total, mark as fully paid
        if (Math.abs(totalAmount - paymentAmount) < 0.01) {
          updateData.tgl_lunas = new Date(paymentDate || new Date());
          updateData.tf_pelunasan = receiptPath;
        }
      } else {
        // This is a final payment on an order with existing down payment
        updateData.tgl_lunas = new Date(paymentDate || new Date());
        updateData.jenis_pembayaran = paymentMethod || "CASH";
        updateData.tf_pelunasan = receiptPath;
        
        // Update sisa if needed
        if (order.sisa !== null) {
          updateData.sisa = "0";
        }
        
        updateData.catatan_tf = notes ? (order.catatan_tf ? `${order.catatan_tf}, ${notes}` : notes) : order.catatan_tf;
      }
      
      // Update the order with payment information
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });
      
      // Create a response object that follows the format expected by the frontend
      const transaction = {
        id: `payment-${orderId}-${Date.now()}`,
        amount: paymentAmount,
        date: new Date(paymentDate || new Date()),
        paymentMethod: paymentMethod || "CASH",
        status: "COMPLETED",
        description: notes ? `Payment for order ${order.spk || order.id}: ${notes}` : `Payment for order ${order.spk || order.id}`,
        notes: notes || null
      };
      
      // Calculate updated payment information for the invoice-like response
      const totalPaid = hasDownPayment 
        ? (isPaid ? totalAmount : downPaymentAmount + paymentAmount)
        : paymentAmount;
      
      const balance = totalAmount - totalPaid;
      
      const invoiceResponse = {
        id: order.id,
        invoiceNumber: order.invoice || `INV-${order.spk || order.id}`,
        amountPaid: totalPaid,
        balance: balance,
        status: Math.abs(balance) < 0.01 ? "PAID" : "PARTIALLY_PAID",
      };
      
      return NextResponse.json(serializeData({
        success: true,
        message: "Payment recorded successfully",
        transaction,
        invoice: invoiceResponse,
      }));
    });
    
  } catch (error: any) {
    console.error("Error recording payment:", error);
    
    return NextResponse.json(
      {
        error: "Failed to record payment",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 