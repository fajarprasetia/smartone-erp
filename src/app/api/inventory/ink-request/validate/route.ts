import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { ink_type, color, quantity, unit, ink_stock_id } = data;

    // Validate required fields
    if (!ink_type || !color || !quantity || !unit || !ink_stock_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the ink stock
    const inkStock = await db.inkStock.findUnique({
      where: { id: ink_stock_id },
    });

    if (!inkStock) {
      return NextResponse.json(
        { 
          valid: false,
          message: "Ink stock not found",
          validationMessages: ["Ink stock not found with the provided ID"]
        },
        { status: 200 }
      );
    }

    // Validate the request against the ink stock
    const validationMessages = [];

    // Check if ink type matches
    if (inkStock.type !== ink_type) {
      validationMessages.push(`Ink type mismatch: Requested ${ink_type}, found ${inkStock.type}`);
    }

    // Check if color matches
    if (inkStock.color !== color) {
      validationMessages.push(`Color mismatch: Requested ${color}, found ${inkStock.color}`);
    }

    // Check if quantity is available
    if (parseFloat(quantity.toString()) > parseFloat(inkStock.quantity.toString())) {
      validationMessages.push(`Insufficient quantity: Requested ${quantity} ${unit}, available ${inkStock.quantity} ${inkStock.unit}`);
    }

    // Check if unit matches
    if (inkStock.unit !== unit) {
      validationMessages.push(`Unit mismatch: Requested ${unit}, available in ${inkStock.unit}`);
    }

    // Check if ink is available
    if (inkStock.availability === "NO") {
      validationMessages.push(`Ink stock is already taken and unavailable`);
    }

    const isValid = validationMessages.length === 0;

    return NextResponse.json({
      valid: isValid,
      message: isValid 
        ? "Ink request is valid" 
        : "Ink request validation failed",
      validationMessages,
      inkStock: {
        id: inkStock.id,
        type: inkStock.type,
        color: inkStock.color,
        quantity: inkStock.quantity,
        unit: inkStock.unit,
        availability: inkStock.availability
      }
    });
  } catch (error) {
    console.error("Error validating ink request:", error);
    return NextResponse.json(
      { 
        valid: false,
        message: "Error validating ink request",
        validationMessages: ["Internal server error"]
      },
      { status: 500 }
    );
  }
} 