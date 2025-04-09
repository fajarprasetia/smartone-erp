import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/customers-new/:id - Get a specific customer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
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
      phone: foundCustomer.telp
    })
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
    const { id } = params
    const body = await req.json()
    const { name, phone } = body
    
    await prisma.$executeRaw`
      UPDATE "customer" 
      SET nama = ${name}, telp = ${phone} 
      WHERE id = ${BigInt(id)}
    `;
    
    const updatedCustomer = await prisma.$queryRaw`
      SELECT id, nama, telp FROM "customer" WHERE id = ${BigInt(id)}
    `;
    
    const customer = Array.isArray(updatedCustomer) && updatedCustomer.length > 0 
      ? updatedCustomer[0] 
      : null;
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found after update' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      id: String(customer.id),
      name: customer.nama,
      phone: customer.telp
    })
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
    
    await prisma.$executeRaw`
      DELETE FROM "customer" WHERE id = ${BigInt(id)}
    `;
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
