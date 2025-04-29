import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: any
) {
  const customerId = params.id;

  if (!customerId || customerId.trim() === '') {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    // Try to find customer by numeric ID first
    const numericId = BigInt(customerId);
    const customer = await prisma.customer.findUnique({
      where: { id: numericId }
    });

    if (!customer) {
      return NextResponse.json({ id: customerId, name: 'Customer not found' });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 