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
    
    // Check if this is a request for the latest invoice number
    const invoicePrefix = url.searchParams.get("invoicePrefix");
    if (invoicePrefix) {
      const latestOrder = await db.order.findFirst({
        where: {
          invoice: {
            startsWith: invoicePrefix
          }
        },
        orderBy: {
          invoice: 'desc'
        }
      });
      
      return NextResponse.json({
        latestInvoice: latestOrder?.invoice || null
      });
    }
    
    // Regular receivable data fetching
    // Get pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const searchAll = url.searchParams.get("searchAll") === "true";
    
    // Get month filter parameter (current month by default)
    const currentDate = new Date();
    const monthParam = url.searchParams.get("month");
    const yearParam = url.searchParams.get("year");
    
    // If month and year params are provided, use them
    // Month is 1-12 (January-December)
    const month = monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : currentDate.getFullYear();
    
    // Create start and end date for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);
    
    // Get sorting parameters
    const sortBy = url.searchParams.get("sortBy") || "tgl_invoice";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Prepare filter conditions
    let whereCondition: any = {};
    
    // Add month filter for invoice date, payment dates, or created_at
    const monthFilter = {
      OR: [
        { tgl_invoice: { gte: startDate, lte: endDate } },
        { tgl_dp: { gte: startDate, lte: endDate } },
        { tgl_lunas: { gte: startDate, lte: endDate } },
        { created_at: { gte: startDate, lte: endDate } }
      ]
    };
    
    // If not searching all records, only include orders with invoices/payment info
    if (!searchAll || !search) {
      whereCondition = {
        AND: [
          {
            OR: [
              { tgl_invoice: { not: null } },
              { invoice: { not: null } },
              { dp: { not: null } },
              { tgl_dp: { not: null } },
              { tgl_lunas: { not: null } },
              { status: "COMPLETED" } // Include orders with COMPLETED status
            ]
          },
          monthFilter
        ]
      };
    } else {
      // When searching the entire database (searchAll = true)
      // If no search term is provided but searchAll is true, limit to recent orders
      if (!search) {
        whereCondition = {
          AND: [
            monthFilter,
            {
              // Only return the most recent orders to avoid performance issues
              created_at: {
                gte: new Date(new Date().setDate(new Date().getDate() - 14)) // last 14 days
              }
            }
          ]
        };
      } else {
        whereCondition = monthFilter;
      }
    }

    // Add search condition if search is provided
    if (search) {
      const searchCondition = {
        OR: searchAll
          ? [
              // When searching all records, focus on finding matches by SPK or customer
              { spk: { contains: search, mode: "insensitive" } },
              { customer: { nama: { contains: search, mode: "insensitive" } } },
            ]
          : [
              // Regular search with more fields
              { spk: { contains: search, mode: "insensitive" } },
              { invoice: { contains: search, mode: "insensitive" } },
              { produk: { contains: search, mode: "insensitive" } },
              { catatan: { contains: search, mode: "insensitive" } },
              { customer: { nama: { contains: search, mode: "insensitive" } } },
              { customer: { telp: { contains: search, mode: "insensitive" } } },
            ]
      };

      // Add search condition to whereCondition
      whereCondition = {
        AND: [
          whereCondition,
          searchCondition
        ]
      };
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
      // Use 'sisa' field for balance if available, otherwise calculate it
      const balance = order.sisa ? parseFloat(order.sisa) : (total - amountPaid);
      
      // Determine payment status
      let status = "UNPAID";
      if (order.tgl_lunas || amountPaid >= total || balance <= 0) {
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
        invoiceNumber: order.invoice || null,
        invoiceDate: order.tgl_invoice || order.created_at || new Date(),
        dueDate: order.tgl_invoice 
          ? new Date(new Date(order.tgl_invoice).setDate(new Date(order.tgl_invoice).getDate() + 30)) 
          : (order.created_at ? new Date(new Date(order.created_at).setDate(new Date(order.created_at).getDate() + 30)) : new Date()),
        status,
        customer: order.customer,
        order: {
          id: order.id,
          spk: order.spk,
          produk: order.produk,
          created_at: order.created_at
        },
        subtotal: total,
        tax: 0, // Tax information might not be tracked in orders
        discount: 0, // Discount information might not be tracked in orders
        total,
        amountPaid,
        balance,
        sisa: order.sisa ? parseFloat(order.sisa) : balance,
        nominal: total,
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
      month: month,
      year: year,
      monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
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
      // Calculate total receivables from nominal value (all orders' total value)
      summary.totalReceivables += invoice.nominal;
      
      // Count overdue invoices using sisa for remaining balance
      if (invoice.status === "OVERDUE") {
        summary.overdue.count++;
        summary.overdue.amount += invoice.sisa;
      } else if (invoice.dueDate < now && invoice.status !== "PAID") {
        // Also count any past due as overdue
        summary.overdue.count++;
        summary.overdue.amount += invoice.sisa;
      }
      
      // Count due soon invoices - check orders created in the last 7 days that aren't fully paid
      const createdDate = invoice.order?.created_at ? new Date(invoice.order.created_at) : null;
      const isRecentOrder = createdDate && ((now.getTime() - createdDate.getTime()) <= 7 * 24 * 60 * 60 * 1000);
      
      if (isRecentOrder && invoice.status !== "PAID") {
        summary.dueSoon.count++;
        summary.dueSoon.amount += invoice.sisa;
      }
      
      // Count paid invoices using nominal - sisa for paid amount
      if (invoice.status === "PAID") {
        summary.paid.count++;
        summary.paid.amount += (invoice.nominal - invoice.sisa);
      } else if (invoice.sisa < invoice.nominal) {
        // Also count partial payments for orders that aren't fully paid
        const partialPayment = invoice.nominal - invoice.sisa;
        if (partialPayment > 0) {
          summary.paid.amount += partialPayment;
        }
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
        timeFrame: {
          month: month,
          year: year,
          monthName: summary.monthName,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
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
    
    // Generate invoice number (SO01MMYYNNNNNN format)
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    
    // Use the prefix if provided, otherwise generate it
    const prefix = data.invoicePrefix || `SO01${month}${year}`;
    
    // Find the latest invoice number with this prefix to determine the sequence
    const latestOrder = await db.order.findFirst({
      where: {
        invoice: {
          startsWith: prefix
        }
      },
      orderBy: {
        invoice: 'desc'
      }
    });

    let sequence = 1;
    if (latestOrder?.invoice) {
      // Extract the sequence number (last 6 digits)
      const sequenceStr = latestOrder.invoice.substring(prefix.length);
      const parsedSequence = parseInt(sequenceStr, 10);
      if (!isNaN(parsedSequence)) {
        sequence = parsedSequence + 1;
      }
    }

    const invoiceNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;
    
    // Update the order with invoice information
    const order = await db.order.update({
      where: {
        id: data.orderId
      },
      data: {
        invoice: invoiceNumber,
        tgl_invoice: new Date(),
        status: "COMPLETED", // Set status to COMPLETED when invoice is generated
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