import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { action, role } = await req.json()
  
  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
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
        })
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    return new NextResponse('Update failed', { status: 500 })
  }
}