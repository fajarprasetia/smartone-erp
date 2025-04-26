import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bigIntSerializer } from '@/lib/utils'

// Helper function to handle BigInt serialization
const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert BigInt to String to avoid serialization issues
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }))
}

export async function PUT(_req: Request, { params }: any) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = params
    const { action, role } = await _req.json()
    
    if (!action || !role) {
      return NextResponse.json(
        { error: "Missing required parameters: action and role" }, 
        { status: 400 }
      )
    }
    
    // Define the data to update based on role and action
    const updateData: any = {
      ...(role === 'Manager' && {
        approve_mng: action === 'approve' ? 'APPROVED' : 'REJECT',
        tgl_app_manager: action === 'approve' ? new Date() : undefined
      }),
      ...(role === 'Operation Manager' && {
        approval_opr: action === 'approve' ? 'APPROVED' : 'REJECT',
        tgl_app_prod: action === 'approve' ? new Date() : undefined
      }),
      ...(action === 'reject' && { reject: 'REJECT' }),
      ...(action === 'approve-reject' && { 
        reject: 'REJECT APPROVED',
        statusm: 'PRINT REJECT'
      }),
      updated_at: new Date()
    }
    
    // Update the order
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true
        // Don't include createdBy which doesn't exist in the database
      }
    })
    
    // Serialize the order to handle BigInt values
    const serializedOrder = serializeData(order)
    
    // Add marketingInfo for consistency with other endpoints
    const processedOrder = {
      ...serializedOrder,
      marketingInfo: serializedOrder.marketing ? { name: serializedOrder.marketing } : null
    }
    
    return NextResponse.json(processedOrder)
  } catch (error) {
    console.error('Error approving order:', error)
    return NextResponse.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}