import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to check if a string is a valid UUID
function isUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET /api/marketing/whatsapp/chats/[customerId] - Get chat messages for a specific customer
export async function GET(req: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const { customerId } = params
    
    // Check if we're dealing with a UUID (new Customer model) or legacy ID
    if (isUuid(customerId)) {
      // For new Customer model, fetch messages directly
      const messages = await prisma.chatMessage.findMany({
        where: {
          customerId: customerId
        },
        orderBy: {
          timestamp: 'asc'
        }
      });
      
      return NextResponse.json(messages);
    } else {
      // For legacy customer, we need to find if there's a corresponding new Customer
      // First, get the legacy customer data
      const legacyCustomer = await prisma.$queryRaw`
        SELECT id, nama, telp FROM "customer" WHERE id = ${BigInt(customerId)}
      `;
      
      const foundCustomer = Array.isArray(legacyCustomer) && legacyCustomer.length > 0 
        ? legacyCustomer[0] 
        : null;
      
      if (!foundCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      // Check if we have a new Customer with matching phone number
      const phone = foundCustomer.telp;
      if (phone) {
        const matchingCustomer = await prisma.Customer.findFirst({
          where: {
            phone: phone
          }
        });
        
        if (matchingCustomer) {
          // If we found a match, return their messages
          const messages = await prisma.chatMessage.findMany({
            where: {
              customerId: matchingCustomer.id
            },
            orderBy: {
              timestamp: 'asc'
            }
          });
          
          return NextResponse.json(messages);
        }
      }
      
      // If no matching customer or no messages, return empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}