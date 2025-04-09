import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/whatsapp/chats/[customerId] - Get chat messages for a specific customer
export async function GET(req: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const { customerId } = params
    
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
    
    // Get chat messages for this customer
    const messages = await prisma.chatMessage.findMany({
      where: { customerId },
      orderBy: { timestamp: 'asc' }
    })
    
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}