import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Get a single vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const vendor = await db.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// Update a vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, email, phone, address, contactPerson, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await db.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Update vendor
    const updatedVendor = await db.vendor.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        contactPerson,
        notes,
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// Delete a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Check if vendor exists
    const existingVendor = await db.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Check if vendor has associated bills
    const vendorBills = await db.bill.findFirst({
      where: { vendorId: id },
    });

    if (vendorBills) {
      return NextResponse.json(
        {
          error: "Cannot delete vendor with associated bills",
        },
        { status: 400 }
      );
    }

    // Delete vendor
    await db.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
} 