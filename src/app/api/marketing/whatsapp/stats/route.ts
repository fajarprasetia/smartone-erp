import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get total message count
    const totalMessages = await prisma.chatMessage.count();

    // Get delivery rate (percentage of sent messages that were delivered)
    const sentMessages = await prisma.chatMessage.count({
      where: {
        isIncoming: false
      }
    });
    
    const deliveredMessages = await prisma.chatMessage.count({
      where: {
        isIncoming: false,
        status: {
          in: ['delivered', 'read']
        }
      }
    });
    
    // Get read rate (percentage of delivered messages that were read)
    const readMessages = await prisma.chatMessage.count({
      where: {
        isIncoming: false,
        status: 'read'
      }
    });
    
    // Get active templates
    let templates = 0;
    try {
      templates = await prisma.whatsAppTemplate.count({
        where: {
          isActive: true
        }
      });
    } catch (error) {
      console.log('WhatsAppTemplate table may not exist:', error);
      // Continue with templates = 0
    }
    
    // Get total number of customers with phone numbers
    const contacts = await prisma.customer.count({
      where: {
        telp: {
          not: null
        }
      }
    });
    
    // Calculate rates (avoid division by zero)
    const deliveryRate = sentMessages > 0 
      ? Math.round((deliveredMessages / sentMessages) * 1000) / 10
      : 0;
    
    const readRate = deliveredMessages > 0
      ? Math.round((readMessages / deliveredMessages) * 1000) / 10
      : 0;
    
    return NextResponse.json({
      totalMessages,
      deliveryRate,
      readRate,
      activeTemplates: templates,
      contacts,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp statistics' },
      { status: 500 }
    );
  }
} 