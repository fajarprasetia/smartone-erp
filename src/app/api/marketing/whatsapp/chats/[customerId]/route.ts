import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to check if a string is a valid UUID
function isUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Helper function to safely convert string to BigInt
function safeBigInt(value: string): BigInt | null {
  try {
    return BigInt(value);
  } catch (error) {
    console.error(`Error converting to BigInt: ${value}`, error);
    return null;
  }
}

// GET /api/marketing/whatsapp/chats/[customerId] - Get chat messages for a specific customer
export async function GET(req: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const { customerId } = params
    
    console.log(`Fetching chat messages for customer: ${customerId}`);
    
    // Check if we're dealing with a UUID (new Customer model) or legacy ID
    if (isUuid(customerId)) {
      console.log(`Customer ID is UUID format: ${customerId}`);
      // For new Customer model, fetch messages directly
      const messages = await prisma.chatMessage.findMany({
        where: {
          customerId: BigInt(customerId),
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
      
      return NextResponse.json(messages);
    }
    
    console.log(`Customer ID is legacy format: ${customerId}`);
    // Convert to bigint safely
    const customerBigInt = BigInt(customerId);
    
    if (!customerBigInt) {
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
        { status: 400 }
      );
    }
    
    // First, check if customer exists and has chat messages
    try {
      const customerExists = await prisma.customer.findUnique({
        where: { id: customerBigInt }
      });
      
      if (!customerExists) {
        console.log(`Customer not found: ${customerId}`);
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      console.log(`Found customer: ${customerExists.nama}`);
      
      // Fetch chat messages directly using customer id
      const messages = await prisma.chatMessage.findMany({
        where: {
          customerId: customerBigInt
        },
        orderBy: {
          timestamp: 'asc'
        }
      });
      
      console.log(`Found ${messages.length} messages for customer ${customerId}`);
      return NextResponse.json(messages);
    } catch (error) {
      console.error(`Error finding customer: ${customerId}`, error);
      return NextResponse.json(
        { error: 'Error finding customer' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST /api/marketing/whatsapp/chats/[customerId] - Send a new message to a specific customer
export async function POST(req: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const { customerId } = params
    const { message } = await req.json()
    
    console.log(`Sending message to customer: ${customerId}`);
    
    // Check if we're dealing with a UUID (new Customer model) or legacy ID
    if (isUuid(customerId)) {
      console.log(`Customer ID is UUID format: ${customerId}`);
      // For new Customer model, send message directly
      const newMessage = await prisma.chatMessage.create({
        data: {
          customerId: BigInt(customerId),
          content: message,
          isIncoming: false,
          timestamp: new Date(),
          messageType: 'text',
        },
      });
      
      return NextResponse.json(newMessage);
    } else {
      console.log(`Customer ID is legacy format: ${customerId}`);
      // Convert to BigInt safely
      const customerBigInt = BigInt(customerId);
      
      if (!customerBigInt) {
        return NextResponse.json(
          { error: 'Invalid customer ID format' },
          { status: 400 }
        );
      }
      
      // First, check if customer exists and has chat messages
      try {
        const customerExists = await prisma.customer.findUnique({
          where: { id: customerBigInt }
        });
        
        if (!customerExists) {
          console.log(`Customer not found: ${customerId}`);
          return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
          );
        }
        
        console.log(`Found customer: ${customerExists.nama}`);
        
        // Send message to customer
        const newMessage = await prisma.chatMessage.create({
          data: {
            customerId: customerBigInt,
            content: message,
            isIncoming: false,
            timestamp: new Date(),
            messageType: 'text',
          },
        });
        
        return NextResponse.json(newMessage);
      } catch (error) {
        console.error(`Error sending message to customer: ${customerId}`, error);
        return NextResponse.json(
          { error: 'Error sending message to customer' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}