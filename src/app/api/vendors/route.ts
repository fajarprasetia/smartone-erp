import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const offset = (page - 1) * pageSize;

    // Get vendors with pagination and search
    const vendors = await db.Vendor.findMany({
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
    const totalVendors = await db.Vendor.count({
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
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, contactPerson, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    // Create new vendor
    const vendor = await db.Vendor.create({
      data: {
        name,
        email,
        phone,
        address,
        contactPerson,
        notes,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
} 