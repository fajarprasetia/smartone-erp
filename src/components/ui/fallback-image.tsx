"use client"

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

interface FallbackImageProps extends Omit<ImageProps, 'src'> {
  src: string
  fallbackBaseUrl?: string
  onError?: () => void
  onSuccess?: () => void
}

/**
 * FallbackImage component that attempts to load an image from the provided src,
 * and if that fails, tries to load it from the fallback URL.
 */
export function FallbackImage({
  src,
  fallbackBaseUrl = 'https://erp.smartone.id/storage/app',
  onError,
  onSuccess,
  alt,
  ...props
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src)
  const [hasError, setHasError] = useState<boolean>(false)
  
  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (!hasError && src.startsWith('/uploads/')) {
      // If the original source fails and it's a local upload path,
      // try the fallback URL
      const relativePath = src.replace(/^\/uploads\//, '')
      const fallbackSrc = `${fallbackBaseUrl}/${relativePath}`
      
      console.log(`Image load failed for ${src}, trying fallback: ${fallbackSrc}`)
      setImgSrc(fallbackSrc)
      setHasError(true)
      onError?.() 
    }
  }

  const handleLoad = () => {
    onSuccess?.()
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
    />
  )
}