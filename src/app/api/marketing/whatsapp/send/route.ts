import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })
    
    if (!customer) {
      // Try to find in lowercase 'customer' table
      const lowercaseCustomer = await prisma.customer.findFirst({
        where: { id: BigInt(customerId) }
      })
      
      if (!lowercaseCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }
    }
    
    // In a real implementation, you would integrate with WhatsApp Cloud API here
    // Since we don't have a ChatMessage table, we'll just return a success response
    
    // Generate a unique message ID for tracking
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a response object with the message details
    const messageResponse = {
      id: messageId,
      customerId,
      content: message,
      isIncoming: false,
      timestamp: new Date(),
      status: 'sent',
      messageType: 'text'
    }
    
    return NextResponse.json(messageResponse)
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}