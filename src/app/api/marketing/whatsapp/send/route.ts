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
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // In a real implementation, you would integrate with WhatsApp Cloud API here
    // For now, we'll just create a record of the message
    
    const chatMessage = await prisma.chatMessage.create({
      data: {
        customerId,
        content: message,
        isIncoming: false, // Message sent by system
        timestamp: new Date(),
        status: 'sent',
        messageType: 'text'
      }
    })
    
    return NextResponse.json(chatMessage)
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}