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
    // Get all SPK numbers from orders
    const orders = await prisma.order.findMany({
      select: {
        spk: true,
      },
      where: {
        spk: {
          not: null,
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
    });

    // Extract SPK numbers and filter out nulls
    const spkNumbers = orders
      .map(order => order.spk)
      .filter(spk => spk !== null && spk !== '');

    return NextResponse.json(serializeData(spkNumbers));
  } catch (error) {
    console.error('Error fetching SPK numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SPK numbers' },
      { status: 500 }
    );
  }
} 