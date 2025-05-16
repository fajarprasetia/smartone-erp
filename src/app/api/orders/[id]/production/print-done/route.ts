import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { bigIntSerializer } from "@/lib/utils";

// Schema for validating the print done data
const printDoneDataSchema = z.object({
  // Print result fields
  prints_bagus: z.string().min(1, "Total good prints is required"),
  prints_reject: z.string().min(1, "Rejected prints is required"),
  prints_waste: z.string().default("0"),
  catatan_print: z.string().default(""),
  // These are optional as we'll force correct values
  status: z.string().optional(), // We always use "PRINT DONE"
  print_done: z.string().optional(), // We default to current date if not provided
  paper_stock_id: z.string().optional(), // ID of the paper stock to update
});

/**
 * API endpoint for marking a print job as done
 * PATCH /api/orders/[id]/production/print-done
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
      const validatedData = printDoneDataSchema.parse(body);
      
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

      // Ensure order is in PRINT status
      if (existingOrder.status !== "PRINT" && existingOrder.status !== "PRINT READY") {
        return NextResponse.json(
          { error: "Order is not in PRINT or PRINT READY status, cannot mark as done." },
          { status: 400 }
        );
      }

      // Get current timestamp for print_done if not provided
      const currentTimestamp = new Date();

      // Determine the status and statusm based on the product type
      let newStatus = "PRINT DONE";  // Default status
      let newStatusm = "PRINT DONE"; // Default statusm
      
      const produk = existingOrder.produk?.toUpperCase() || "";
      
      if (produk === "PRINT ONLY") {
        newStatus = "COMPLETED";
        newStatusm = "COMPLETED";
      } else if (produk.includes("PRESS")) {
        newStatus = "PRESS READY";
        newStatusm = "PRINT DONE";
      } else if (!produk.includes("PRESS") && produk.includes("CUTTING")) {
        newStatus = "CUTTING READY";
        newStatusm = "PRINT DONE";
      }

      // Update the order with print done information
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          // Print result details
          prints_bagus: validatedData.prints_bagus,
          prints_reject: validatedData.prints_reject,
          prints_waste: validatedData.prints_waste,
          catatan_print: validatedData.catatan_print,
          
          // Update status based on product type
          status: newStatus,
          statusm: newStatusm,
          
          // Update completion timestamp (full timestamp, not just date)
          print_done: validatedData.print_done ? new Date(validatedData.print_done) : currentTimestamp,
        },
        include: {
          customer: true,
          print: true,
        }
      });

      // Update paper stock remaining length if paper_stock_id is provided
      if (validatedData.paper_stock_id) {
        try {
          // First, get current paper stock details
          const paperStock = await prisma.paperStock.findUnique({
            where: { id: validatedData.paper_stock_id }
          });

          if (paperStock && paperStock.remainingLength !== null) {
            // Calculate total used paper
            const goodPrints = parseFloat(validatedData.prints_bagus || "0");
            const rejectedPrints = parseFloat(validatedData.prints_reject || "0");
            const wastePrints = parseFloat(validatedData.prints_waste || "0");
            
            const totalUsed = goodPrints + rejectedPrints + wastePrints;
            
            // Calculate new remaining length
            const newRemainingLength = Math.max(0, paperStock.remainingLength - totalUsed);
            
            // Update paper stock
            await prisma.paperStock.update({
              where: { id: validatedData.paper_stock_id },
              data: {
                remainingLength: newRemainingLength,
                updatedByUserId: session.user.id,
                dateUpdated: currentTimestamp
              }
            });
          }
        } catch (paperError) {
          console.error("Error updating paper stock:", paperError);
          // We continue even if paper update fails
        }
      }

      // Serialize the order data to handle BigInt values
      const serializedOrder = bigIntSerializer(updatedOrder);

      // Return the updated order
      return NextResponse.json({
        message: "Print job marked as completed",
        order: serializedOrder
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid print done data",
            details: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error marking print as done:", error);
    return NextResponse.json(
      { 
        error: "Failed to mark print as done",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 