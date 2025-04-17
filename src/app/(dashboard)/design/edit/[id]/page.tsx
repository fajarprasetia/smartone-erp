"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditDesignPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [orderSpk, setOrderSpk] = useState<string | null>(null)
  
  // Fetch basic order info
  useEffect(() => {
    const fetchOrderInfo = async () => {
      if (!orderId) return
      
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (response.ok) {
          const data = await response.json()
          setOrderSpk(data.spk || "Unknown SPK")
        } else {
          console.error("Failed to fetch order info")
        }
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrderInfo()
  }, [orderId])
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Design Management
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              `Edit Design: ${orderSpk}`
            )}
          </CardTitle>
          <CardDescription>
            Design editing functionality will be implemented in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              <p>Design editing functionality for order ID: {orderId} will be implemented in a future update.</p>
              <p>This page will include:</p>
              <ul className="list-disc pl-5">
                <li>Design file upload and management</li>
                <li>Design approval workflow</li>
                <li>Design revision history</li>
                <li>Design notes and communication</li>
              </ul>
              <div className="mt-6">
                <Button onClick={() => router.push('/design')}>
                  Return to Design Management
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 