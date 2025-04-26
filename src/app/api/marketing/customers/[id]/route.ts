import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/marketing/customers/[id] - Get a specific customer
export async function GET(_req: Request, { params }: any) {
  try {
    const id = Number(params.id)

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: customer.id.toString(),
      nama: customer.nama,
      telp: customer.telp,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/marketing/customers/[id] - Update a customer
export async function PUT(req: Request, { params }: any) {
  try {
    const id = Number(params.id)
    const body = await req.json();
    const { nama, telp } = body;

    // Check if customer exists first
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { 
        nama,
        telp: telp ? telp.replace(/^(0|62)/, '') : null,
      }
    });

    return NextResponse.json({
      id: customer.id.toString(),
      nama: customer.nama,
      telp: customer.telp,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/customers/[id] - Delete a customer
export async function DELETE(_req: Request, { params }: any) {
  try {
    const id = Number(params.id)

    await prisma.customer.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}