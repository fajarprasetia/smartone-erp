import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isUuid } from '@/lib/utils'

// GET /api/marketing/customers-new/:id - Get a specific customer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Check if UUID (new model) or numeric ID (legacy)
    if (isUuid(id)) {
      const customer = await prisma.customer.findUnique({
        where: { id: id }
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: null,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        isLegacy: false
      })
    } else {
      const customer = await prisma.$queryRaw`
        SELECT id, nama, telp FROM "customer" WHERE id = ${BigInt(id)}
      `;

      const foundCustomer = Array.isArray(customer) && customer.length > 0 
        ? customer[0] 
        : null;

      if (!foundCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: String(foundCustomer.id),
        name: foundCustomer.nama,
        phone: foundCustomer.telp,
        email: null,
        address: null,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLegacy: true
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/marketing/customers-new/:id - Update a customer
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, phone, email, address } = body;
    
    if (isUuid(id)) {
      // Update new Customer model
      const customer = await prisma.Customer.update({
        where: { id: id },
        data: { name, phone, email, address }
      });

      return NextResponse.json({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: null,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        isLegacy: false
      });
    } else {
      // Update legacy customer
      await prisma.$executeRaw`
        UPDATE "customer"
        SET nama = ${name}, telp = ${phone}
        WHERE id = ${BigInt(id)}
      `;

      const updatedCustomer = await prisma.$queryRaw`
        SELECT id, nama, telp FROM "customer" WHERE id = ${BigInt(id)}
      `;

      const foundCustomer = Array.isArray(updatedCustomer) && updatedCustomer.length > 0 
        ? updatedCustomer[0] 
        : null;

      return NextResponse.json({
        id: String(foundCustomer.id),
        name: foundCustomer.nama,
        phone: foundCustomer.telp,
        email: null,
        address: null,
        status: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLegacy: true
      });
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/marketing/customers-new/:id - Delete a customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (isUuid(id)) {
      await prisma.Customer.delete({ where: { id: id } });
    } else {
      await prisma.$executeRaw`
        DELETE FROM "customer" WHERE id = ${BigInt(id)}
      `;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}