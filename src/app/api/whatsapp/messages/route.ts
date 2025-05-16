import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    
    // Get real messages from the database
    const messages = await prisma.chatMessage.findMany({
      where: {
        customerId: BigInt(customerId),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
      include: {
        customer: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
    
    // If no messages found yet, return empty array
    if (!messages || messages.length === 0) {
      return NextResponse.json({ messages: [] });
    }
    
    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        isIncoming: msg.isIncoming,
        status: msg.status,
        messageType: msg.messageType,
        mediaUrl: msg.mediaUrl,
        whatsappMessageId: msg.whatsappMessageId
      }))
    });
  } catch (error) {
    console.error("Error fetching WhatsApp messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp messages" },
      { status: 500 }
    )
  }
}

// POST endpoint to send a new message
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json();
    const { customerId, content, messageType = "text", mediaUrl } = body;
    
    if (!customerId || !content) {
      return NextResponse.json(
        { error: "Customer ID and message content are required" }, 
        { status: 400 }
      );
    }
    
    // Create a new outgoing message
    const message = await prisma.chatMessage.create({
      data: {
        customerId,
        content,
        isIncoming: false, // Outgoing message
        messageType,
        mediaUrl,
        status: "sent", // Initial status
        whatsappMessageId: `manual-${Date.now()}`, // Placeholder ID for manual messages
      }
    });
    
    return NextResponse.json({ 
      message: {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        isIncoming: message.isIncoming,
        status: message.status,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        whatsappMessageId: message.whatsappMessageId
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
} 