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
    const url = new URL(req.url);
    
    // Get pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    
    // Get sorting parameters
    const sortBy = url.searchParams.get("sortBy") || "tgl_invoice";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Prepare filter conditions - only fetch orders with invoices/payment info
    let whereCondition: any = {
      // Only include orders that have invoice information or payments
      OR: [
        { tgl_invoice: { not: null } },
        { invoice: { not: null } },
        { dp: { not: null } },
        { tgl_dp: { not: null } },
        { tgl_lunas: { not: null } }
      ]
    };

    // Add search condition if search is provided
    if (search) {
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        { spk: { contains: search, mode: "insensitive" } },
        { invoice: { contains: search, mode: "insensitive" } },
        { produk: { contains: search, mode: "insensitive" } },
        { catatan: { contains: search, mode: "insensitive" } },
        { customer: { nama: { contains: search, mode: "insensitive" } } },
        { customer: { telp: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Add status filter if provided
    if (status) {
      if (status === "PAID") {
        whereCondition.tgl_lunas = { not: null };
      } else if (status === "PARTIALLY_PAID") {
        whereCondition.tgl_dp = { not: null };
        whereCondition.tgl_lunas = null;
      } else if (status === "UNPAID") {
        whereCondition.tgl_dp = null;
        whereCondition.tgl_lunas = null;
        whereCondition.invoice = { not: null }; // Has invoice but no payments
      } else if (status === "OVERDUE") {
        // Overdue could be defined as invoice date more than 30 days ago with no payment
        whereCondition.tgl_invoice = {
          lt: new Date(new Date().setDate(new Date().getDate() - 30))
        };
        whereCondition.tgl_lunas = null;
      }
    }

    // Get total count for pagination
    const totalCount = await db.order.count({
      where: whereCondition,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Prepare orderBy object dynamically - handle date fields specially
    const orderBy: Record<string, string> = {};
    
    // Handle special case for date fields to ensure proper sorting
    if (sortBy === "dueDate") {
      // Map dueDate to tgl_invoice for sorting
      orderBy["tgl_invoice"] = sortOrder;
    } else if (sortBy === "invoiceDate") {
      orderBy["tgl_invoice"] = sortOrder;
    } else if (sortBy === "invoiceNumber") {
      orderBy["invoice"] = sortOrder;
    } else if (sortBy === "amountPaid") {
      // For amount paid, first sort by whether it's fully paid, then by amount
      orderBy["tgl_lunas"] = sortOrder;
      if (sortOrder === "asc") {
        orderBy["tgl_dp"] = "asc";
        orderBy["dp"] = "asc";
      } else {
        orderBy["tgl_dp"] = "desc";
        orderBy["dp"] = "desc";
      }
    } else if (sortBy === "total") {
      orderBy["nominal"] = sortOrder;
    } else {
      // For other fields, use the standard sorting
      orderBy[sortBy] = sortOrder;
    }

    // Fetch orders with pagination and include related data
    const orders = await db.order.findMany({
      where: whereCondition,
      include: {
        customer: {
          select: {
            id: true,
            nama: true,
            telp: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy,
    });

    // Process orders to format them as invoices
    const invoices = orders.map(order => {
      const total = order.nominal ? parseFloat(order.nominal) : 0;
      const downPayment = order.dp ? parseFloat(order.dp) : 0;
      const amountPaid = order.tgl_lunas ? total : downPayment;
      const balance = total - amountPaid;
      
      // Determine payment status
      let status = "UNPAID";
      if (order.tgl_lunas) {
        status = "PAID";
      } else if (order.tgl_dp) {
        status = "PARTIALLY_PAID";
      } else if (order.tgl_invoice && new Date(order.tgl_invoice) < new Date(new Date().setDate(new Date().getDate() - 30))) {
        status = "OVERDUE";
      }
      
      // Create transactions array
      const transactions = [];
      
      // Add down payment transaction if exists
      if (order.tgl_dp && order.dp) {
        transactions.push({
          id: `dp-${order.id}`,
          amount: parseFloat(order.dp),
          date: order.tgl_dp,
          paymentMethod: order.jenis_pembayaran || "CASH",
          status: "COMPLETED",
          description: `Down payment for order ${order.spk || order.id}`
        });
      }
      
      // Add full payment transaction if exists
      if (order.tgl_lunas) {
        const fullPaymentAmount = order.sisa ? parseFloat(order.sisa) : (total - downPayment);
        transactions.push({
          id: `full-${order.id}`,
          amount: fullPaymentAmount,
          date: order.tgl_lunas,
          paymentMethod: order.jenis_pembayaran || "CASH",
          status: "COMPLETED",
          description: `Final payment for order ${order.spk || order.id}`
        });
      }
      
      // Convert order to invoice format
      return {
        id: order.id,
        invoiceNumber: order.invoice || `INV-${order.spk || order.id}`,
        invoiceDate: order.tgl_invoice || order.created_at || new Date(),
        dueDate: order.tgl_invoice 
          ? new Date(new Date(order.tgl_invoice).setDate(new Date(order.tgl_invoice).getDate() + 30)) 
          : (order.created_at ? new Date(new Date(order.created_at).setDate(new Date(order.created_at).getDate() + 30)) : new Date()),
        status,
        customer: order.customer,
        order: {
          id: order.id,
          spk: order.spk,
          produk: order.produk
        },
        subtotal: total,
        tax: 0, // Tax information might not be tracked in orders
        discount: 0, // Discount information might not be tracked in orders
        total,
        amountPaid,
        balance,
        notes: order.catatan || order.catatan_tf,
        transactions
      };
    });

    // Calculate summary statistics
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    // Initialize summary
    const summary = {
      totalReceivables: 0,
      overdue: {
        count: 0,
        amount: 0,
      },
      dueSoon: {
        count: 0,
        amount: 0,
      },
      paid: {
        count: 0,
        amount: 0,
      },
    };
    
    // Calculate summary from processed invoices
    for (const invoice of invoices) {
      // Only count balance for unpaid/partially paid
      if (invoice.status !== "PAID") {
        summary.totalReceivables += invoice.balance;
      }
      
      // Count overdue invoices
      if (invoice.status === "OVERDUE") {
        summary.overdue.count++;
        summary.overdue.amount += invoice.balance;
      } else if (invoice.dueDate < now && invoice.status !== "PAID") {
        // Also count any past due as overdue
        summary.overdue.count++;
        summary.overdue.amount += invoice.balance;
      }
      
      // Count due soon invoices (due within a week, not overdue yet)
      if (invoice.dueDate >= now && invoice.dueDate <= oneWeekFromNow && invoice.status !== "PAID") {
        summary.dueSoon.count++;
        summary.dueSoon.amount += invoice.balance;
      }
      
      // Count paid invoices
      if (invoice.status === "PAID") {
        summary.paid.count++;
        summary.paid.amount += invoice.total;
      }
    }

    return NextResponse.json(
      serializeData({
        invoices,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize,
        },
        summary,
      })
    );
  } catch (error: any) {
    console.error("Error fetching receivable data:", error);
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
    
    if (!data.orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Generate invoice number (INV-YYYYMMDD-XXXX format)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the latest invoice number to generate a sequence
    const latestOrder = await db.order.findFirst({
      where: {
        invoice: {
          startsWith: `INV-${dateStr}-`
        }
      },
      orderBy: {
        invoice: 'desc'
      }
    });

    let sequence = 1;
    if (latestOrder?.invoice) {
      const parts = latestOrder.invoice.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    const invoiceNumber = `INV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    
    // Update the order with invoice information
    const order = await db.order.update({
      where: {
        id: data.orderId
      },
      data: {
        invoice: invoiceNumber,
        tgl_invoice: new Date(),
        // Add any additional invoice data from the request
        ...data.additionalData
      }
    });

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully",
      orderId: order.id,
      invoiceNumber
    });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 