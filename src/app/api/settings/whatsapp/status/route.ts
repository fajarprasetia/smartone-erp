import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Try to get the WhatsApp configuration from the database
    let config;
    
    try {
      config = await prisma.whatsAppConfig.findFirst();
    } catch (error) {
      console.error('Error finding WhatsApp config:', error);
      // Return disconnected if the table doesn't exist
      return NextResponse.json({
        status: 'disconnected',
        message: 'WhatsApp Business API not configured'
      });
    }
    
    if (!config) {
      return NextResponse.json({
        status: 'disconnected',
        message: 'WhatsApp Business API not configured'
      });
    }
    
    // Return the current connection status
    return NextResponse.json({
      status: config.status || 'disconnected',
      lastChecked: config.lastChecked,
      phoneNumberId: config.phoneNumberId ? true : false,
      businessAccountId: config.businessAccountId ? true : false,
      apiKey: config.apiKey ? true : false,
      accessToken: config.accessToken ? true : false
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return NextResponse.json(
      { 
        status: 'disconnected',
        error: 'Failed to fetch WhatsApp status' 
      },
      { status: 500 }
    );
  }
} 