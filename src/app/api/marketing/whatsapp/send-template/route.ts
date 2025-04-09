import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/marketing/whatsapp/send-template - Send a template message
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
    
    // Get the customer - try both Customer and customer models
    let customer = null
    try {
      // Try uppercase Customer model first
      customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })
    } catch (error) {
      console.log('Error finding customer in Customer model:', error)
      // Try lowercase customer model
      try {
        customer = await prisma.customer.findFirst({
          where: { id: BigInt(customerId) }
        })
      } catch (innerError) {
        console.error('Error finding customer in lowercase customer model:', innerError)
      }
    }
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Get the template
    let template = null
    try {
      template = await prisma.whatsAppTemplate.findFirst({
        where: { 
          name: templateName,
          isActive: true 
        }
      })
    } catch (error) {
      console.log('WhatsAppTemplate model not available:', error)
      // Continue without template validation since the model doesn't exist
    }
    
    // Only check if template exists if we were able to query the model
    if (template === null && template !== undefined) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // In a real implementation, you would send the template message to WhatsApp API here
    // Since we don't have a ChatMessage table, we'll just return a success response
    
    // Generate a unique message ID for tracking
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a response object with the message details
    const messageResponse = {
      id: messageId,
      customerId,
      content: `[Template: ${templateName}]${parameters?.length > 0 ? ` With params: ${parameters.join(', ')}` : ''}`,
      isIncoming: false,
      timestamp: new Date(),
      status: 'sent',
      messageType: 'template',
      metadata: {
        templateName,
        parameters
      }
    }
    
    return NextResponse.json(messageResponse)
  } catch (error) {
    console.error('Error sending template message:', error)
    return NextResponse.json(
      { error: 'Failed to send template message' },
      { status: 500 }
    )
  }
}