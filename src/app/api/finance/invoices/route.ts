import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mock invoice data
const mockInvoices = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2024-001",
    invoiceDate: new Date('2024-05-01').toISOString(),
    dueDate: new Date('2024-05-15').toISOString(),
    status: "UNPAID",
    customerId: "customer-1",
    customer: {
      id: "customer-1",
      nama: "PT. ABC Indonesia",
      telp: "081234567890"
    },
    subtotal: 5000000,
    tax: 550000,
    discount: 0,
    total: 5550000,
    items: []
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2024-002",
    invoiceDate: new Date('2024-04-15').toISOString(),
    dueDate: new Date('2024-04-30').toISOString(),
    status: "PAID",
    customerId: "customer-2",
    customer: {
      id: "customer-2",
      nama: "CV. XYZ Printing",
      telp: "087654321098"
    },
    subtotal: 3200000,
    tax: 352000,
    discount: 320000,
    total: 3232000,
    items: []
  }
];

// Create a new invoice
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      invoiceNumber, 
      invoiceDate, 
      dueDate, 
      customerId, 
      status, 
      subtotal,
      tax,
      discount,
      total,
      items = []
    } = data;
    
    // Validate required fields
    if (!invoiceNumber || !invoiceDate || !dueDate || !customerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Create a mock invoice response
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      status: status || "UNPAID",
      customerId,
      customer: {
        id: customerId,
        nama: "Customer Name",
        telp: "123456789"
      },
      subtotal: subtotal || 0,
      tax: tax || 0,
      discount: discount || 0,
      total: total || 0,
      items: items || []
    };
    
    // Return the new invoice
    return NextResponse.json(newInvoice, { status: 201 });
    
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ 
      error: "Failed to create invoice", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Get invoices with filters and pagination
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    // If an ID is provided, return a single invoice
    if (id) {
      const invoice = mockInvoices.find(inv => inv.id === id);
      
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      
      return NextResponse.json(invoice);
    }
    
    // Handle pagination and filtering
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search") || "";
    
    // Filter invoices
    let filteredInvoices = [...mockInvoices];
    
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    if (customerId) {
      filteredInvoices = filteredInvoices.filter(inv => inv.customerId === customerId);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.customer.nama.toLowerCase().includes(searchLower)
      );
    }
    
    // Get total count and apply pagination
    const totalCount = filteredInvoices.length;
    const paginatedInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);
    
    // Return invoices with pagination info
    return NextResponse.json({
      invoices: paginatedInvoices,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        pageCount: Math.ceil(totalCount / pageSize)
      }
    });
    
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ 
      error: "Failed to fetch invoices", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Update an invoice
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }
    
    const invoiceIndex = mockInvoices.findIndex(inv => inv.id === id);
    
    if (invoiceIndex === -1) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Create updated invoice
    const updatedInvoice = {
      ...mockInvoices[invoiceIndex],
      ...data,
      // Convert dates if provided
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : mockInvoices[invoiceIndex].invoiceDate,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : mockInvoices[invoiceIndex].dueDate
    };
    
    // Return the updated invoice
    return NextResponse.json(updatedInvoice);
    
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ 
      error: "Failed to update invoice", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Delete an invoice
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }
    
    // In a real application, you would delete from the database
    // Just return success for now
    return NextResponse.json({ 
      success: true, 
      message: "Invoice deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ 
      error: "Failed to delete invoice", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 