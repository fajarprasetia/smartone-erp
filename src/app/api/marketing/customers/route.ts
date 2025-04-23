import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/customers - Get all customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, telp } = body;

    if (!nama) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate nama
    const existingNama = await prisma.customer.findFirst({
      where: { nama }
    });

    if (existingNama) {
      return NextResponse.json(
        { error: 'Customer with this name already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate telp if provided
    if (telp) {
      const formattedTelp = telp.replace(/^(0|62)/, '');
      const existingTelp = await prisma.customer.findFirst({
        where: { telp: formattedTelp }
      });

      if (existingTelp) {
        return NextResponse.json(
          { error: `This phone number registered to ${existingTelp.nama}` },
          { status: 400 }
        );
      }

      const customer = await prisma.customer.create({
        data: {
          nama,
          telp: formattedTelp,
        }
      });

      return NextResponse.json({
        id: customer.id.toString(),
        nama: customer.nama,
        telp: customer.telp,
      }, { status: 201 });
    } else {
      const customer = await prisma.customer.create({
        data: {
          nama,
          telp: null,
        }
      });

      return NextResponse.json({
        id: customer.id.toString(),
        nama: customer.nama,
        telp: customer.telp,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

// GET /api/marketing/customers - Get all customers
export async function GET(req: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        nama: true,
        telp: true,
      },
      orderBy: {
        nama: 'asc'
      }
    });

    return NextResponse.json(customers.map(customer => ({
      id: customer.id.toString(),
      nama: customer.nama,
      telp: customer.telp,
    })));
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// GET /api/marketing/customers/:id - Get a specific customer
export async function GETById(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

// DELETE /api/marketing/customers/:id - Delete a customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
