import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper function to handle BigInt serialization in JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// Generate a fallback SPK number based on current date and time
function generateFallbackSpk() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  // Generate a random 3-digit number for fallback
  const random = Math.floor(100 + Math.random() * 900);
  
  // Format as MMYYXXX (ensuring 3 digits with leading zeros)
  const formattedNumber = String(random).padStart(3, '0');
  
  return `${month}${year}${formattedNumber}`;
}

// GET: Generate a new SPK number or fetch order by SPK
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const spk = searchParams.get("spk");
    const numericOnly = searchParams.get("numericOnly") === "true";

    if (!spk) {
      return NextResponse.json(
        { error: "SPK parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching order by SPK: ${spk}, numericOnly: ${numericOnly}`);

    // Build the where condition based on numericOnly flag
    const whereCondition = numericOnly 
      ? { id: spk } // If numericOnly is true, look up by ID
      : { spk: spk }; // Otherwise look up by SPK
    
    // Look up order by SPK
    const order = await db.order.findFirst({
      where: whereCondition,
      include: {
        customer: true,
        asal_bahan_rel: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designer: {
          select: {
            id: true,
            name: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      console.log(`[API] Order with SPK ${spk} not found`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`[API] Successfully found order with SPK: ${spk}`);

    // Process marketing field to determine if it's a user ID or plain string
    let marketingInfo = null;
    
    if (order.marketing) {
      try {
        // Try to interpret the marketing field as a user ID
        const user = await db.user.findUnique({
          where: { id: order.marketing },
          select: { id: true, name: true, email: true }
        });
        
        if (user) {
          marketingInfo = {
            id: user.id,
            name: user.name,
            email: user.email
          };
        } else {
          // Fallback: treat marketing as a plain string if not a valid user ID
          marketingInfo = { name: order.marketing };
        }
      } catch (error) {
        console.error('Error fetching marketing user:', error);
        // Fallback to using the marketing field as a name
        marketingInfo = { name: order.marketing };
      }
    }

    // Format and return the order
    const processedOrder = {
      ...order,
      marketingInfo,
      createdBy: order.user
        ? { id: order.user.id, name: order.user.name }
        : null,
      // Map operator, designer, and manager fields to appropriate names
      user_id: order.user
        ? { name: order.user.name }
        : null,
      designer_id: order.designer
        ? { name: order.designer.name }
        : null,
      opr_id: order.operator
        ? { name: order.operator.name }
        : null,
      manager_id: order.manager
        ? { name: order.manager.name }
        : null,
    };

    return NextResponse.json(serializeData(processedOrder));
  } catch (error: any) {
    console.error("Error fetching order by SPK:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch order",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

export async function GETAll(request: NextRequest) {
  try {
    // Get all SPK numbers from orders
    const orders = await db.order.findMany({
      select: {
        spk: true,
      },
      where: {
        spk: {
          not: null,
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
    });

    // Extract SPK numbers and filter out nulls
    const spkNumbers = orders
      .map(order => order.spk)
      .filter(spk => spk !== null && spk !== '');

    return NextResponse.json(serializeData(spkNumbers));
  } catch (error) {
    console.error('Error fetching SPK numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SPK numbers' },
      { status: 500 }
    );
  }
}