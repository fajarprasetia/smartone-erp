"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface FileInputProps {
  accept?: string
  onChange: (file: File | null) => void
  preview?: string | null
  label: string
  className?: string
  clearable?: boolean
  icon?: React.ReactNode
}

export function FileInput({
  accept = "image/*",
  onChange,
  preview,
  label,
  className,
  clearable = true,
  icon = <ImageIcon className="h-4 w-4 mr-1" />
}: FileInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    if (files && files.length > 0) {
      const file = files[0]
      onChange(file)
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      
      // Clean up previous preview URL
      return () => URL.revokeObjectURL(objectUrl)
    }
  }

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onChange(null)
    setPreviewUrl(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2 items-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-input-${label.replace(/\s+/g, "-").toLowerCase()}`}
        />
        
        <Button
          type="button"
          variant="outline"
          className="flex-1 bg-background/50 border-border/50"
          onClick={() => fileInputRef.current?.click()}
        >
          {icon}
          {label}
        </Button>
        
        {clearable && previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            className="bg-background/50 border-border/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {previewUrl && (
        <div className="relative aspect-video flex items-center justify-center border rounded-md overflow-hidden bg-background/50">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  )
} 