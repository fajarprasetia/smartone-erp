import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    
    if (!status) {
      return NextResponse.json(
        { error: "Status parameter is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching orders with status: ${status}`);

    try {
      // Fetch orders with the specified status - with simplified customer fields
      const orders = await prisma.order.findMany({
        where: {
          status: status
        },
        include: {
          customer: {
            select: {
              id: true,
              nama: true,
              telp: true
            }
          },
          print: {
            select: {
              id: true,
              name: true
            }
          },
          press: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          updated_at: "desc"
        }
      });

      console.log(`Found ${orders.length} orders with status ${status}`);
      
      // Process fabric origin information separately
      const processedOrders = await Promise.all(orders.map(async (order: any) => {
        // Process fabric origin (asal_bahan) if possible
        if (order.asal_bahan_id) {
          try {
            const originCustomer = await prisma.customer.findUnique({
              where: { id: order.asal_bahan_id },
              select: { id: true, nama: true }
            });
            
            if (originCustomer) {
              order.originalCustomer = originCustomer;
            }
          } catch (error) {
            console.error('Error resolving fabric origin customer:', error);
          }
        }
        
        return order;
      }));
      
      // Serialize and return the orders directly as an array
      return NextResponse.json(serializeData(processedOrders));
    } catch (dbError) {
      console.error("Database query error:", dbError);
      // Log detailed error message
      if (dbError instanceof Error) {
        console.error("Error message:", dbError.message);
        console.error("Error stack:", dbError.stack);
      }
      throw dbError; // Rethrow to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    // Create a user-friendly error response
    let errorMessage = "Failed to fetch orders";
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 