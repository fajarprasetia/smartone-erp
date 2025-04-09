import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/marketing/whatsapp/blast - Send WhatsApp template messages to multiple customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerIds, templateId, templateName, language, parameters } = body
    
    if (!customerIds || !customerIds.length || !templateId) {
      return NextResponse.json(
        { error: 'Customer IDs and template ID are required' },
        { status: 400 }
      )
    }
    
    // Verify template exists
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId }
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Get customers
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        phone: { not: null } // Only customers with phone numbers
      }
    })
    
    if (!customers.length) {
      return NextResponse.json(
        { error: 'No valid customers found' },
        { status: 400 }
      )
    }
    
    // In a real implementation, you would integrate with WhatsApp Cloud API here
    // For now, we'll just create records of the messages
    
    let successCount = 0
    let failedCount = 0
    
    // Create a message for each customer
    const messagePromises = customers.map(async (customer) => {
      try {
        // Format message content with template parameters
        const messageContent = `Template: ${templateName} (Parameters: ${JSON.stringify(parameters)})`
        
        await prisma.chatMessage.create({
          data: {
            customerId: customer.id,
            content: messageContent,
            isIncoming: false, // Message sent by system
            timestamp: new Date(),
            status: 'sent',
            messageType: 'template'
          }
        })
        
        successCount++
        return true
      } catch (error) {
        console.error(`Error sending message to customer ${customer.id}:`, error)
        failedCount++
        return false
      }
    })
    
    await Promise.all(messagePromises)
    
    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      total: customers.length
    })
  } catch (error) {
    console.error('Error sending blast messages:', error)
    return NextResponse.json(
      { error: 'Failed to send blast messages' },
      { status: 500 }
    )
  }
}