import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { bigIntSerializer } from "@/lib/utils";

// Schema for validating the print data
const printDataSchema = z.object({
  // Print fields
  gramasi: z.string().optional(),
  lebar_kertas: z.string().optional(),
  lebar_file: z.string().optional(),
  rip: z.string().optional(),
  dimensi_file: z.string().optional(),
  prints_mesin: z.string().optional(),
  prints_icc: z.string().optional(),
  prints_target: z.string().optional(),
  prints_qty: z.string().optional(),
  prints_bagus: z.string().optional(),
  prints_waste: z.string().optional(),
  paper_stock_id: z.string().optional(),
  // Print operator
  print_id: z.string(),
  // These are optional as we'll force correct values
  status: z.string().optional(), // We always use "PRINT"
  tgl_print: z.string().optional(), // We default to current date if not provided
  waktu_rip: z.string().optional(), // Time when RIP process was done
});

/**
 * API endpoint for updating print information
 * PATCH /api/orders/[id]/production/print
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get order ID from params
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = printDataSchema.parse(body);
      
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      // Get current timestamp for tgl_print if not provided
      const currentTimestamp = new Date();

      // Update the order with print information
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          // Print details
          gramasi: validatedData.gramasi,
          lebar_kertas: validatedData.lebar_kertas,
          lebar_file: validatedData.lebar_file,
          rip: validatedData.rip,
          dimensi_file: validatedData.dimensi_file,
          prints_mesin: validatedData.prints_mesin,
          prints_icc: validatedData.prints_icc,
          prints_target: validatedData.prints_target,
          prints_qty: validatedData.prints_qty,
          prints_bagus: validatedData.prints_bagus,
          prints_waste: validatedData.prints_waste,
          
          // Update print operator
          print: {
            connect: {
              id: validatedData.print_id
            }
          },
          
          // Explicitly update status to PRINT
          status: "PRINT", // Force status to PRINT regardless of input
          
          // Update timestamp for tgl_print (with full timestamp, not just date)
          tgl_print: validatedData.tgl_print ? new Date(validatedData.tgl_print) : currentTimestamp,
          
          // Update waktu_rip if provided
          ...(validatedData.waktu_rip && { waktu_rip: new Date(`1970-01-01T${validatedData.waktu_rip}:00Z`) }),
        },
        include: {
          customer: true,
          print: true,
        }
      });

      // Serialize the order data to handle BigInt values
      const serializedOrder = bigIntSerializer(updatedOrder);

      // Return the updated order
      return NextResponse.json({
        message: "Order status updated to PRINT and print information saved",
        order: serializedOrder
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid print data",
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating print information:", error);
    return NextResponse.json(
      { 
        error: "Failed to update print information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 