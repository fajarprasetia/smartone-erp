"use client"

import { useEffect, ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DialogModalProps {
  /**
   * Whether the dialog is open
   */
  open: boolean
  /**
   * Callback when the dialog open state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Dialog title
   */
  title: string
  /**
   * Optional dialog description
   */
  description?: string
  /**
   * Dialog content
   */
  children: ReactNode
  /**
   * Optional max width of the dialog. Defaults to "md"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  /**
   * Optional max height of the dialog. Defaults to "90vh"
   */
  maxHeight?: string
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "full": "max-w-full"
}

export function DialogModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "lg",
  maxHeight = "90vh"
}: DialogModalProps) {
  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div 
        className={`bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full ${maxWidthMap[maxWidth]} mx-4 overflow-auto`}
        style={{ maxHeight }}
      >
        <div className="flex justify-between items-center p-6 border-b border-border/40">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
} 