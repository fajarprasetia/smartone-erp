import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, phoneNumber, templateName, parameters = [] } = body

    if (!phoneNumber || !templateName || !customerId) {
      return NextResponse.json({ 
        error: "Customer ID, phone number, and template name are required" 
      }, { status: 400 })
    }

    // Find the template in the database
    const template = await prisma.whatsAppTemplate.findFirst({
      where: {
        name: templateName,
        isActive: true
      }
    })

    if (!template) {
      return NextResponse.json({ 
        error: `Template "${templateName}" not found or not active` 
      }, { status: 404 })
    }

    // In a real app, this would call the WhatsApp API to send the template message
    // For demonstration, we'll create a chat message record
    
    // Format template content with parameters (simplified version)
    const components = template.components as any
    let templateContent = `[Template: ${templateName}]`
    
    if (components && Array.isArray(components)) {
      // Add components content
      templateContent += components.map((component: any) => {
        let text = component.text || ""
        
        // Replace template parameters if they exist
        if (parameters && parameters.length > 0) {
          parameters.forEach((param: string, index: number) => {
            text = text.replace(`{{${index + 1}}}`, param)
          })
        }
        
        return `\n${component.type}: ${text}`
      }).join('')
    }
    
    // Save the message to the database
    const message = await prisma.chatMessage.create({
      data: {
        customerId,
        content: templateContent,
        isIncoming: false, // Outgoing message
        messageType: "template",
        status: "sent",
        whatsappMessageId: `template-${Date.now()}`, // Placeholder ID for template messages
        metadata: JSON.stringify({
          templateName,
          parameters,
          components: template.components
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        status: message.status
      }
    })
  } catch (error) {
    console.error("Error sending WhatsApp template:", error)
    return NextResponse.json(
      { error: "Failed to send WhatsApp template" },
      { status: 500 }
    )
  }
} 