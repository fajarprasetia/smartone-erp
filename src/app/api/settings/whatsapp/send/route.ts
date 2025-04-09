import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request data
    const data = await request.json()
    const { phoneNumber, message, templateName, templateParams } = data
    
    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }
    
    if (!message && !templateName) {
      return NextResponse.json({ error: "Either message or template name is required" }, { status: 400 })
    }

    // Get WhatsApp settings from database
    const settings = await prisma.setting.findMany({
      where: {
        category: "whatsapp",
      },
    })

    if (!settings || settings.length === 0) {
      return NextResponse.json({ error: "WhatsApp settings not configured" }, { status: 400 })
    }

    // Convert settings array to object for easier access
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    // Check for required settings
    const requiredSettings = ["phoneNumberId", "accessToken"]
    for (const key of requiredSettings) {
      if (!settingsMap[key]) {
        return NextResponse.json({ error: `Missing WhatsApp configuration: ${key}` }, { status: 400 })
      }
    }

    // Format the phone number (remove any spaces, ensure it starts with country code)
    let formattedPhone = phoneNumber.replace(/\s+/g, '')
    if (!formattedPhone.startsWith('+')) {
      // If no country code is provided, assume Indonesia (+62)
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+62' + formattedPhone.substring(1)
      } else {
        formattedPhone = '+62' + formattedPhone
      }
    }

    try {
      let messagePayload

      if (templateName) {
        // Send template message
        messagePayload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "id" // Default to Indonesian
            },
            components: templateParams ? templateParams : []
          }
        }
      } else {
        // Send text message
        messagePayload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: true,
            body: message
          }
        }
      }

      // Send message to WhatsApp Business API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${settingsMap.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settingsMap.accessToken}`,
          },
          body: JSON.stringify(messagePayload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("WhatsApp API error:", errorData)
        return NextResponse.json(
          {
            status: "error",
            message: `Failed to send message: ${errorData.error?.message || response.statusText}`,
          },
          { status: response.status }
        )
      }

      const responseData = await response.json()

      // Log the message in the database
      await prisma.whatsappMessage.create({
        data: {
          messageId: responseData.messages?.[0]?.id || "unknown",
          phoneNumber: formattedPhone,
          message: message || JSON.stringify(templateParams),
          templateName: templateName || null,
          status: "sent",
          sentBy: session.user.id,
        },
      })

      return NextResponse.json({
        status: "success",
        message: "Message sent successfully",
        details: responseData,
      })
    } catch (error: any) {
      console.error("Error sending WhatsApp message:", error)
      return NextResponse.json(
        {
          status: "error",
          message: `Failed to send message: ${error.message || "Unknown error"}`,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in WhatsApp send API:", error)
    return NextResponse.json(
      { 
        error: "Failed to send WhatsApp message",
        message: error.message 
      },
      { status: 500 }
    )
  }
} 