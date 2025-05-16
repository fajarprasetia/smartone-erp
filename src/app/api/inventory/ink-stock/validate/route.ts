import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request data
    const data = await req.json();
    const { barcode_id, ink_type, color, quantity, unit } = data;

    if (!barcode_id) {
      return NextResponse.json(
        { error: "Barcode ID is required" },
        { status: 400 }
      );
    }

    // Find ink stock by barcode
    const inkStock = await db.inkStock.findUnique({
      where: { barcode_id: barcode_id }
    });

    if (!inkStock) {
      return NextResponse.json(
        { error: "Ink stock not found with the provided barcode" },
        { status: 404 }
      );
    }

    // Validate availability
    if (inkStock.availability !== "YES") {
      return NextResponse.json(
        { error: "This ink stock is not available for allocation" },
        { status: 400 }
      );
    }

    // Initialize validation messages array
    const validationMessages = [];

    // Validate ink type
    if (ink_type && inkStock.type?.toLowerCase() !== ink_type.toLowerCase()) {
      validationMessages.push(`Ink type mismatch: Requested ${ink_type}, found ${inkStock.type}`);
    }

    // Validate color
    if (color && inkStock.color?.toLowerCase() !== color.toLowerCase()) {
      validationMessages.push(`Color mismatch: Requested ${color}, found ${inkStock.color}`);
    }

    // Validate quantity and unit
    if (quantity && unit) {
      const requestedQty = parseFloat(quantity);
      
      if (requestedQty > inkStock.quantity) {
        validationMessages.push(`Insufficient quantity: Requested ${quantity} ${unit}, available ${inkStock.quantity} ${inkStock.unit}`);
      }
      
      if (unit.toLowerCase() !== inkStock.unit.toLowerCase()) {
        validationMessages.push(`Unit mismatch: Requested ${unit}, found ${inkStock.unit}`);
      }
    }

    // If there are validation issues, return them
    if (validationMessages.length > 0) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationMessages.join(". ") 
        },
        { status: 400 }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Ink stock validation successful",
      inkStock: {
        id: inkStock.id,
        type: inkStock.type,
        color: inkStock.color,
        quantity: inkStock.quantity,
        unit: inkStock.unit
      }
    });

  } catch (error) {
    console.error("Error validating ink stock:", error);
    return NextResponse.json(
      { error: "Failed to validate ink stock" },
      { status: 500 }
    );
  }
} 