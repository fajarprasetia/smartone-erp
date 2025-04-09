import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true
      },
      orderBy: {
        tanggal: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}