import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Custom serializer for BigInt values
const bigIntSerializer = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string for serialization
  }
  
  if (data instanceof Date) {
    return data.toISOString(); // Properly format Date objects
  }
  
  if (Array.isArray(data)) {
    return data.map(item => bigIntSerializer(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = bigIntSerializer(data[key]);
      }
    }
    return result;
  }
  
  return data;
};

export async function PUT(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const orderId = params.id;
    
    console.log('Processing approval for order:', orderId);
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    console.log('Finding order with ID:', orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.log('Order not found:', orderId);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    console.log('Found order:', order.id);

    const body = await req.json();
    console.log('Request body:', body);

    // Update order based on user role and request body
    let updateData = {};
    
    try {
      if (session.user.role?.name === "Manager") {
        updateData = {
          approve_mng: "APPROVED", // Using approve_mng (DB field)
          manager_id: session.user.id,
          tgl_app_manager: new Date(body.tgl_app_manager || Date.now())
        };

        // Only update status if Operation Manager has already approved
        if (order.approval_opr === "APPROVED") {
          updateData = { 
            ...updateData, 
            status: body.status || "PRINT READY" 
          };
        }
      } else if (session.user.role?.name === "Operation Manager") {
        updateData = {
          approval_opr: "APPROVED",
          opr_id: session.user.id,
          tgl_app_prod: new Date(body.tgl_app_prod || Date.now())
        };

        // Only update status if Manager has already approved
        if (order.approve_mng === "APPROVED") {
          updateData = { 
            ...updateData, 
            status: body.status || "PRINT READY" 
          };
        }
      } else {
        return NextResponse.json(
          { error: "Unauthorized role" },
          { status: 403 }
        );
      }

      console.log('Updating order with data:', updateData);
      
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });
      
      console.log('Successfully updated order:', updatedOrder.id);

      return NextResponse.json(
        bigIntSerializer(updatedOrder),
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error during order update:', dbError);
      return NextResponse.json({
        error: 'Failed to update order in database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating approval status:", error);
    return NextResponse.json({ 
      error: "Failed to update approval status",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 