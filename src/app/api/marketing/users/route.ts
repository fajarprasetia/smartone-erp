import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to serialize data and handle BigInt values
const serializeData = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export async function GET(req: NextRequest) {
  try {
    // Fetch users with Marketing role
    const marketingUsers = await prisma.user.findMany({
      where: {
        role: {
          name: 'Marketing'
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json(serializeData(marketingUsers));
  } catch (error) {
    console.error('Error fetching marketing users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing users', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}