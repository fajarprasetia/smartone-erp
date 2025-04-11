import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/customers - Get all customers
export async function GET(req: NextRequest) {
  try {
    // Use raw SQL query for legacy customers
    const legacyCustomers = await prisma.$queryRaw`SELECT * FROM customer ORDER BY nama ASC`;
    
    // Get new model customers
    const newCustomers = await prisma.customer.findMany({
      orderBy: {
        nama: 'asc'
      },
      select: {
        id: true,
        nama: true,
        telp: true
      }
    });

    const mappedCustomers = newCustomers.map(customer => ({
      id: customer.id,
      name: customer.nama,
      phone: customer.telp
    }));
    
    // Map the legacy customers
    const mappedLegacyCustomers = Array.isArray(legacyCustomers) 
      ? legacyCustomers.map(customer => ({
          id: String(customer.id),
          name: customer.nama,
          phone: customer.telp,
          email: null,
          address: null,
          status: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isLegacy: true
        }))
      : [];
    
    // Format the new customers to match the legacy format
    const formattedNewCustomers = newCustomers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || null,
      email: customer.email || null,
      address: customer.address || null,
      status: null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      isLegacy: false
    }));
    
    // Combine both sets of customers
    const allCustomers = [...mappedLegacyCustomers, ...formattedNewCustomers];
    
    return NextResponse.json(mappedCustomers);
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
    
    // Create customer using new Customer model
    const customer = await prisma.Customer.create({
      data: {
        name,
        phone,
        email,
        address
      }
    });
    
    // Format response
    const formattedCustomer = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      status: null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      isLegacy: false
    }
    
    return NextResponse.json(formattedCustomer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}