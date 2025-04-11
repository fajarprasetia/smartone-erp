import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/customers-new - Get all customers
export async function GET(req: NextRequest) {
  try {
    // Get customers from the Customer model
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    // Format the customers for the response
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.telp || null,
      email: null, // Email field removed from schema
      address: customer.address || null,
      status: null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      isLegacy: false
    }));
    
    return NextResponse.json(formattedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/marketing/customers-new - Create a new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const { name, phone } = body
    
    // Create customer using customer model
    const customer = await prisma.customer.create({
      data: {
        name: name,
        phone: phone
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