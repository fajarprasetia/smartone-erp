import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { phoneNumber, message } = body

    if (!phoneNumber || !message) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Get WhatsApp settings from environment variables
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      return new NextResponse("WhatsApp configuration missing", { status: 500 })
    }

    // Format phone number to E.164 format
    const formattedPhoneNumber = phoneNumber.replace(/\D/g, "")

    // Send message using WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhoneNumber,
          type: "text",
          text: { body: message },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("WhatsApp API error:", error)
      return new NextResponse("Failed to send message", { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 