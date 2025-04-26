import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to handle serialization of data (including BigInt)
const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(
      data,
      (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export async function GET(request: NextRequest) {
  try {
    // Get all active customers - using customer model instead of customers
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        nama: true,
        telp: true,
      },
      orderBy: {
        nama: 'asc',
      },
    });

    return NextResponse.json(serializeData(customers));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 