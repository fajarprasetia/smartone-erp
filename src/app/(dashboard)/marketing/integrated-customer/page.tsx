"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from "lucide-react"

export default function IntegratedCustomerRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  useEffect(() => {
    // Redirect to the customer page with the same tab parameter if it exists
    if (tabParam) {
      router.replace(`/marketing/customer?tab=${tabParam}`)
    } else {
      router.replace('/marketing/customer')
    }
  }, [router, tabParam])
  
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to customer management...</p>
    </div>
  )
} 