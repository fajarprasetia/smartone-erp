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

// POST /api/marketing/whatsapp/send - Send a WhatsApp message to a customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, message } = body
    
    if (!customerId || !message) {
      return NextResponse.json(
        { error: 'Customer ID and message are required' },
        { status: 400 }
      )
    }
    
    // Convert customerId to BigInt safely
    const customerBigInt = safeBigInt(customerId);
    
    if (!customerBigInt) {
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
        { status: 400 }
      );
    }
    
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerBigInt }
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // In a real implementation, you would integrate with WhatsApp Cloud API here
    
    // Create a ChatMessage record
    const chatMessage = await prisma.chatMessage.create({
      data: {
        content: message,
        isIncoming: false, // outgoing message (from us to customer)
        timestamp: new Date(),
        status: 'sent',
        messageType: 'text',
        customerId: customerBigInt,
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
    }
    
    return NextResponse.json({
      message: messageResponse,
      success: true
    })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}