"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { MoveUpRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CaptureThumbnailsProps {
  capture?: string | null
  captureName?: string | null
  tf_dp?: string | null
  tf_pelunasan?: string | null
  altText?: string
  className?: string
}

export function CaptureThumbnails({
  capture,
  captureName,
  tf_dp,
  tf_pelunasan,
  altText = "Design",
  className
}: CaptureThumbnailsProps) {
  const [activeImage, setActiveImage] = useState<{ url: string, title: string } | null>(null)
  
  // Open the modal with the selected image
  const openImage = (url: string, title: string) => {
    setActiveImage({ url, title })
  }
  
  // Close the modal
  const closeImage = () => {
    setActiveImage(null)
  }

  // Handle body overflow when modal is open
  useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [activeImage])

  // Create image URLs with proper path
  const captureUrl = capture ? (capture.startsWith('/') ? capture : `/uploads/${capture}`) : null
  const captureNameUrl = captureName ? (captureName.startsWith('/') ? captureName : `/uploads/${captureName}`) : null
  const dpReceiptUrl = tf_dp ? (tf_dp.startsWith('/') ? tf_dp : `/tfuploads/${tf_dp}`) : null
  const settlementReceiptUrl = tf_pelunasan ? (tf_pelunasan.startsWith('/') ? tf_pelunasan : `/tfuploads/${tf_pelunasan}`) : null
  
  // Check if any thumbnails should be displayed
  const hasThumbnails = captureUrl || captureNameUrl || dpReceiptUrl || settlementReceiptUrl
  
  if (!hasThumbnails) {
    return <span className="text-muted-foreground">None</span>
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Capture thumbnail */}
      {captureUrl && (
        <div 
          className="relative h-8 w-8 cursor-pointer rounded-sm border border-border/50 overflow-hidden hover:border-primary/50 transition-colors"
          onClick={() => openImage(captureUrl, "Design Preview")}
          title="Design Preview"
        >
          <Image
            src={captureUrl}
            alt={`${altText} preview`}
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <MoveUpRight className="h-3 w-3 text-white drop-shadow-md" />
          </div>
        </div>
      )}
      
      {/* Capture name thumbnail */}
      {captureNameUrl && (
        <div 
          className="relative h-8 w-8 cursor-pointer rounded-sm border border-border/50 overflow-hidden hover:border-primary/50 transition-colors"
          onClick={() => openImage(captureNameUrl, "File Name Preview")}
          title="File Name Preview"
        >
          <Image
            src={captureNameUrl}
            alt={`${altText} file name`}
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <MoveUpRight className="h-3 w-3 text-white drop-shadow-md" />
          </div>
        </div>
      )}
      
      {/* DP Receipt thumbnail */}
      {dpReceiptUrl && (
        <div 
          className="relative h-8 w-8 cursor-pointer rounded-sm border border-amber-300 border-2 overflow-hidden hover:border-amber-500 transition-colors"
          onClick={() => openImage(dpReceiptUrl, "Down Payment Receipt")}
          title="Down Payment Receipt"
        >
          <Image
            src={dpReceiptUrl}
            alt="DP Receipt"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <MoveUpRight className="h-3 w-3 text-white drop-shadow-md" />
          </div>
        </div>
      )}
      
      {/* Settlement Receipt thumbnail */}
      {settlementReceiptUrl && (
        <div 
          className="relative h-8 w-8 cursor-pointer rounded-sm border border-green-300 border-2 overflow-hidden hover:border-green-500 transition-colors"
          onClick={() => openImage(settlementReceiptUrl, "Settlement Receipt")}
          title="Settlement Receipt"
        >
          <Image
            src={settlementReceiptUrl}
            alt="Settlement Receipt"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <MoveUpRight className="h-3 w-3 text-white drop-shadow-md" />
          </div>
        </div>
      )}
      
      {/* Image preview modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeImage}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border/40">
              <h2 className="text-lg font-medium">{activeImage.title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeImage}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative aspect-video w-full">
              <Image
                src={activeImage.url}
                alt={activeImage.title}
                fill
                className="object-contain p-4"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 