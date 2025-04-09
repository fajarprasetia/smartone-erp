import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    
    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }
    
    // Mock messages for the selected customer
    const mockMessages = [
      {
        id: "msg1",
        content: "Hello! How can I assist you today?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isIncoming: false,
        status: "read"
      },
      {
        id: "msg2",
        content: "I have a question about my order #12345",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9), // 1.9 hours ago
        isIncoming: true,
        status: "read"
      },
      {
        id: "msg3",
        content: "I'd be happy to help with that. What specifically would you like to know about your order?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.8), // 1.8 hours ago
        isIncoming: false,
        status: "read"
      },
      {
        id: "msg4",
        content: "When will it be delivered?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.7), // 1.7 hours ago
        isIncoming: true,
        status: "read"
      },
      {
        id: "msg5",
        content: "Your order is currently being processed and will be shipped within 2 business days. You should receive it by next week Tuesday.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.6), // 1.6 hours ago
        isIncoming: false,
        status: "read"
      },
      {
        id: "msg6",
        content: "Thank you for the information!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
        isIncoming: true,
        status: "read"
      },
      {
        id: "msg7",
        content: "You're welcome! Is there anything else I can help you with?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        isIncoming: false,
        status: "read"
      }
    ];
    
    return NextResponse.json({
      messages: mockMessages
    })
  } catch (error) {
    console.error("Error fetching WhatsApp messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp messages" },
      { status: 500 }
    )
  }
} 