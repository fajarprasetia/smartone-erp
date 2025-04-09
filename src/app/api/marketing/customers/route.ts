import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/customers - Get all customers
export async function GET(req: NextRequest) {
  try {
    // Use raw SQL query instead of Prisma model to handle BigInt ID
    const customers = await prisma.$queryRaw`SELECT * FROM customer ORDER BY nama ASC`;
    
    // Map the result and convert BigInt ID to string for JSON serialization
    const mappedCustomers = Array.isArray(customers) 
      ? customers.map(customer => ({
          id: String(customer.id),
          name: customer.nama,
          phone: customer.telp,
          email: null,
          address: null,
          status: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      : [];
    
    return NextResponse.json(mappedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/marketing/customers - Create a new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const { name, phone, email, address } = body
    
    // Use raw SQL query to insert customer
    const result = await prisma.$queryRaw`
      INSERT INTO customer (nama, telp)
      VALUES (${name}, ${phone || null})
      RETURNING *
    `;
    
    // Extract the customer from the result
    const customer = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }
    
    // Map to uppercase model format for consistent frontend handling
    const mappedCustomer = {
      id: String(customer.id),
      name: customer.nama,
      phone: customer.telp,
      email: null,
      address: null,
      status: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return NextResponse.json(mappedCustomer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}