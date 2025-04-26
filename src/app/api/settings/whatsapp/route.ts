import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get WhatsApp settings
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin role
    const isAdmin = 
      session.user.role.name === "System Administrator" || 
      session.user.role.name === "Administrator"

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Get the WhatsApp configuration
    let config = await prisma.whatsAppConfig.findFirst()

    // If no configuration exists, create a default one
    if (!config) {
      config = await prisma.whatsAppConfig.create({
        data: {
          apiKey: "",
          phoneNumberId: "",
          businessAccountId: "",
          accessToken: "",
          webhookVerifyToken: "",
          status: "disconnected",
          lastChecked: null,
        },
      })
    }

    // Return the configuration with sensitive fields masked for security
    return NextResponse.json({
      ...config,
      accessToken: config.accessToken ? "••••••••••••••••" : "",
    })
  } catch (error) {
    console.error("[WHATSAPP_CONFIG_GET]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Save or update WhatsApp settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has admin role
    const isAdmin = 
      session.user.role.name === "System Administrator" || 
      session.user.role.name === "Administrator"

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Get the request body
    const body = await request.json()
    
    // Get the existing configuration
    const existingConfig = await prisma.whatsAppConfig.findFirst()
    
    // Don't overwrite accessToken if it's masked in the request
    if (body.accessToken === "••••••••••••••••" && existingConfig?.accessToken) {
      body.accessToken = existingConfig.accessToken
    }
    
    // Update or create the configuration
    const config = await prisma.whatsAppConfig.upsert({
      where: {
        id: existingConfig?.id || "",
      },
      update: {
        apiKey: body.apiKey,
        phoneNumberId: body.phoneNumberId,
        businessAccountId: body.businessAccountId,
        accessToken: body.accessToken,
        webhookVerifyToken: body.webhookVerifyToken,
        status: body.status || "disconnected",
        lastChecked: body.lastChecked ? new Date(body.lastChecked) : null,
      },
      create: {
        apiKey: body.apiKey,
        phoneNumberId: body.phoneNumberId,
        businessAccountId: body.businessAccountId,
        accessToken: body.accessToken,
        webhookVerifyToken: body.webhookVerifyToken,
        status: body.status || "disconnected",
        lastChecked: body.lastChecked ? new Date(body.lastChecked) : null,
      },
    })
    
    // Return the configuration with sensitive fields masked for security
    return NextResponse.json({
      ...config,
      accessToken: config.accessToken ? "••••••••••••••••" : "",
    })
  } catch (error) {
    console.error("[WHATSAPP_CONFIG_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 