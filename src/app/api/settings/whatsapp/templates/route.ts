import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get WhatsApp settings from database
    const settings = await prisma.setting.findMany({
      where: {
        category: "whatsapp",
      },
    })

    if (!settings || settings.length === 0) {
      return NextResponse.json({ error: "WhatsApp settings not configured" }, { status: 400 })
    }

    // Convert settings array to object for easier access
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    // Check for required settings
    const requiredSettings = ["businessAccountId", "accessToken"]
    for (const key of requiredSettings) {
      if (!settingsMap[key]) {
        return NextResponse.json({ error: `Missing WhatsApp configuration: ${key}` }, { status: 400 })
      }
    }

    try {
      // Fetch templates from WhatsApp Business API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${settingsMap.businessAccountId}/message_templates?limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${settingsMap.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("WhatsApp API error:", errorData)
        return NextResponse.json(
          {
            status: "error",
            message: `Failed to fetch templates: ${errorData.error?.message || response.statusText}`,
          },
          { status: response.status }
        )
      }

      const responseData = await response.json()

      // Transform the data to a more usable format for the frontend
      const templates = responseData.data.map((template: any) => ({
        id: template.id,
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        components: template.components,
        createdTime: template.created_time,
      }))

      return NextResponse.json({
        status: "success",
        templates,
        paging: responseData.paging,
      })
    } catch (error: any) {
      console.error("Error fetching WhatsApp templates:", error)
      return NextResponse.json(
        {
          status: "error",
          message: `Failed to fetch templates: ${error.message || "Unknown error"}`,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in WhatsApp templates API:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch WhatsApp templates",
        message: error.message 
      },
      { status: 500 }
    )
  }
} 