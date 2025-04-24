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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
          approve_mng: body.approval_mng || "APPROVED", // Using approve_mng (DB field) from approval_mng (frontend field)
          manager_id: session.user.id,
          tgl_app_manager: new Date(body.tgl_app_manager || Date.now()),
          status: body.status || "PRINT READY" // Add status field with default
        };
        console.log('Manager approval update data:', updateData);
      } else if (session.user.role?.name === "Operation Manager") {
        updateData = {
          approval_opr: body.approval_opr || "APPROVED",
          opr_id: session.user.id,
          tgl_app_prod: new Date(body.tgl_app_prod || Date.now()),
          status: body.status || "PRINT READY" // Add status field with default
        };
        console.log('Operation Manager approval update data:', updateData);
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
    } catch (dbError: any) {
      console.error('Database error during order update:', dbError.message);
      
      // Extract field error information if available
      const fieldErrors = dbError.message.match(/Unknown argument `([^`]+)`\. Did you mean `([^`]+)`\?/);
      let errorMessage = 'Failed to update order in database';
      
      if (fieldErrors && fieldErrors.length > 2) {
        const [_, wrongField, correctField] = fieldErrors;
        errorMessage = `Invalid field: '${wrongField}'. The correct field name is '${correctField}'.`;
        
        console.log(`Field name error detected: ${errorMessage}`);
        
        // Try to auto-correct the field name and retry the update
        if (session.user.role?.name === "Manager" && wrongField === 'approval_mng' && correctField === 'approve_mng') {
          try {
            console.log('Attempting to auto-correct Manager field name and retry update...');
            
            const correctedData = {
              [correctField]: body.approval_mng || "APPROVED",
              manager_id: session.user.id,
              tgl_app_manager: new Date(body.tgl_app_manager || Date.now()),
              status: body.status || "PRINT READY" // Add status field with default
            };
            
            console.log('Corrected update data:', correctedData);
            
            const updatedOrder = await prisma.order.update({
              where: { id: orderId },
              data: correctedData
            });
            
            console.log('Successfully updated order with corrected field:', updatedOrder.id);
            
            return NextResponse.json(
              bigIntSerializer(updatedOrder),
              { status: 200 }
            );
          } catch (retryError) {
            console.error('Failed to update with corrected field:', retryError);
          }
        } else if (session.user.role?.name === "Operation Manager") {
          // Handle auto-correction for Operation Manager field names if needed
          try {
            console.log('Attempting to auto-correct Operation Manager field name and retry update...');
            
            // Create a corrected data object based on the field name correction
            const correctedData = {
              [correctField]: body.approval_opr || "APPROVED",
              opr_id: session.user.id,
              tgl_app_prod: new Date(body.tgl_app_prod || Date.now()),
              status: body.status || "PRINT READY" // Add status field with default
            };
            
            console.log('Corrected update data:', correctedData);
            
            const updatedOrder = await prisma.order.update({
              where: { id: orderId },
              data: correctedData
            });
            
            console.log('Successfully updated order with corrected field:', updatedOrder.id);
            
            return NextResponse.json(
              bigIntSerializer(updatedOrder),
              { status: 200 }
            );
          } catch (retryError) {
            console.error('Failed to update with corrected field:', retryError);
          }
        }
      }
      
      return NextResponse.json({
        error: errorMessage,
        details: dbError.message
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