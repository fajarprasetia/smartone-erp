import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to safely convert string to BigInt
function safeBigInt(value: string): BigInt | null {
  try {
    return BigInt(value);
  } catch (error) {
    console.error(`Error converting to BigInt: ${value}`, error);
    return null;
  }
}

// POST /api/marketing/whatsapp/send-template - Send a template WhatsApp message to a customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, templateName, parameters } = body
    
    if (!customerId || !templateName) {
      return NextResponse.json(
        { error: 'Customer ID and template name are required' },
        { status: 400 }
      )
    }
    
    // Convert customerId to BigInt safely
    const customerBigInt = BigInt(customerId);
    
    if (!customerBigInt) {
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
        { status: 400 }
      );
    }
    
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerBigInt) }
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // In a real implementation, you would fetch the template from WhatsApp Business API
    // and then send it with the parameters
    
    // Format content to show template info
    const contentText = `[Template: ${templateName}]${parameters && parameters.length > 0 ? 
      ` With params: ${parameters.join(', ')}` : ''}`;
    
    // Create a ChatMessage record
    const chatMessage = await prisma.chatMessage.create({
      data: {
        content: contentText,
        isIncoming: false, // outgoing message (from us to customer)
        timestamp: new Date(),
        status: 'sent',
        messageType: 'template',
        metadata: JSON.stringify({
          templateName,
          parameters
        }),
        customerId: Number(customerBigInt),
      }
    });
    
    // Create a response object with the message details
    const messageResponse = {
      id: chatMessage.id,
      content: chatMessage.content,
      isIncoming: chatMessage.isIncoming,
      timestamp: chatMessage.timestamp,
      status: chatMessage.status,
      messageType: chatMessage.messageType,
      customerId: customerId,
      templateName,
      parameters,
    }
    
    return NextResponse.json({
      message: messageResponse,
      success: true
    })
  } catch (error) {
    console.error('Error sending template WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Failed to send template WhatsApp message: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}