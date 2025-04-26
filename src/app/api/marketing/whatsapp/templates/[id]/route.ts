import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for template update
const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  header: z.object({
    format: z.enum(['TEXT', 'NONE']),
    text: z.string().optional(),
  }).optional(),
  body: z.object({
    text: z.string().min(1, 'Body text is required'),
    example: z.string().optional(),
  }),
  footer: z.object({
    text: z.string().optional(),
  }).optional(),
})

// GET /api/marketing/whatsapp/templates/[id] - Get a specific template
export async function GET(_req: Request, { params }: any) {
  try {
    const { id } = params

    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PUT /api/marketing/whatsapp/templates/[id] - Update a template
export async function PUT(req: Request, { params }: any) {
  try {
    const { id } = params
    const body = await req.json()

    // Validate the request body
    const validatedData = updateTemplateSchema.parse(body)

    // Check if the template exists
    const existingTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Prepare components data for WhatsApp API format
    const components = []
    
    // Add header if present
    if (validatedData.header?.format === 'TEXT' && validatedData.header.text) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: validatedData.header.text
      })
    }
    
    // Add body
    components.push({
      type: 'BODY',
      text: validatedData.body.text,
      example: validatedData.body.example ? {
        body_text: [validatedData.body.example]
      } : undefined
    })
    
    // Add footer if present
    if (validatedData.footer?.text) {
      components.push({
        type: 'FOOTER',
        text: validatedData.footer.text
      })
    }

    // Update the template
    const updatedTemplate = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        name: validatedData.name,
        components: components,
        isActive: true
      }
    })

    return NextResponse.json({ 
      success: true,
      template: updatedTemplate 
    })
  } catch (error) {
    console.error('Error updating template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/marketing/whatsapp/templates/[id] - Delete a template
export async function DELETE(_req: Request, { params }: any) {
  try {
    const { id } = params

    // Check if the template exists
    const existingTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Delete the template
    await prisma.whatsAppTemplate.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
} 