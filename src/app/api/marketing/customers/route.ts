import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Create a new customer
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
    // Check if there's an id in the searchParams - to handle getting a single customer
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Handle single customer request
      const customerId = Number(id);
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
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
    }

    // Handle listing all customers
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
