import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/marketing/whatsapp/templates - Get all WhatsApp templates
export async function GET(req: NextRequest) {
  try {
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp templates' },
      { status: 500 }
    )
  }
}

// POST /api/marketing/whatsapp/templates - Create a new WhatsApp template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, language, components } = body
    
    if (!name || !components) {
      return NextResponse.json(
        { error: 'Name and components are required' },
        { status: 400 }
      )
    }
    
    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        language: language || 'en',
        components,
        isActive: true
      }
    })
    
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating WhatsApp template:', error)
    return NextResponse.json(
      { error: 'Failed to create WhatsApp template' },
      { status: 500 }
    )
  }
}