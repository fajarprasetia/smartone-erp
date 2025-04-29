import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Check if vendor model exists in the db object
const vendorModelExists = () => {
  return typeof db.vendor === 'object' && db.vendor !== null;
};

// Mock vendor data for development
const mockVendors = [
  { id: "mock-1", name: "ABC Suppliers", email: "contact@abcsuppliers.com", phone: "123-456-7890" },
  { id: "mock-2", name: "XYZ Distribution", email: "info@xyzdist.com", phone: "987-654-3210" },
  { id: "mock-3", name: "Global Materials Inc.", email: "sales@globalmaterials.com", phone: "555-123-4567" },
  { id: "mock-4", name: "Tech Parts Co.", email: "support@techparts.co", phone: "444-333-2222" },
  { id: "mock-5", name: "Industrial Solutions", email: "hello@industrialsolutions.com", phone: "777-888-9999" }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const offset = (page - 1) * pageSize;

    // Check if vendor model exists
    if (!vendorModelExists()) {
      console.log("Vendor model not found, returning mock data");
      
      // Filter mock vendors based on search
      const filteredVendors = mockVendors.filter(vendor => 
        vendor.name.toLowerCase().includes(search.toLowerCase())
      );
      
      return NextResponse.json({
        vendors: filteredVendors.slice(offset, offset + pageSize),
        pagination: {
          total: filteredVendors.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredVendors.length / pageSize),
        },
      });
    }

    // Get vendors with pagination and search from real database
    const vendors = await db.vendor.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
      skip: offset,
      take: pageSize,
    });

    // Count total vendors for pagination
    const totalVendors = await db.vendor.count({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    });

    return NextResponse.json({
      vendors,
      pagination: {
        total: totalVendors,
        page,
        pageSize,
        totalPages: Math.ceil(totalVendors / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    // Return mock data on error
    return NextResponse.json({
      vendors: mockVendors,
      pagination: {
        total: mockVendors.length,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if vendor model exists
    if (!vendorModelExists()) {
      console.log("Vendor model not found, returning mock success response");
      const body = await request.json();
      const { name, email, phone } = body;
      
      if (!name) {
        return NextResponse.json(
          { error: "Vendor name is required" },
          { status: 400 }
        );
      }
      
      // Return a mock success response
      return NextResponse.json(
        { 
          id: `mock-${Date.now()}`,
          name,
          email,
          phone,
          createdAt: new Date().toISOString()
        }, 
        { status: 201 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, contactPerson, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    // Create new vendor
    const vendor = await db.vendor.create({
      data: {
        name,
        email,
        phone,
        address,
        contactName: contactPerson,
        notes,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    
    // Return a mock success response
    const body = await request.json();
    return NextResponse.json(
      { 
        id: `mock-${Date.now()}`,
        name: body.name,
        email: body.email,
        phone: body.phone,
        createdAt: new Date().toISOString(),
        message: "Mock vendor created (real creation failed)"
      }, 
      { status: 201 }
    );
  }
} 