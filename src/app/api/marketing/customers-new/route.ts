import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/marketing/customers-new
export async function GET(req: NextRequest) {
  try {
    const customers = await prisma.$queryRaw`SELECT * FROM customer ORDER BY nama ASC`;
    
    const mappedCustomers = Array.isArray(customers) 
      ? customers.map(c => ({
          id: String(c.id),
          name: c.nama,
          phone: c.telp
        }))
      : [];
    
    return NextResponse.json(mappedCustomers);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/marketing/customers-new
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone } = body;
    
    const result = await prisma.$queryRaw`
      INSERT INTO customer (nama, telp) 
      VALUES (${name}, ${phone || null})
      RETURNING *
    `;
    
    const customer = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    return NextResponse.json({
      id: String(customer.id),
      name: customer.nama,
      phone: customer.telp
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}