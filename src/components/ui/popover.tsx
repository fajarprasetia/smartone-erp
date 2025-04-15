"use client"

import * as React from "react"
import { useEffect } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "full": "max-w-full"
}

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

interface PopoverContentProps extends React.ComponentProps<typeof PopoverPrimitive.Content> {
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  sticky?: "always" | "partial"
  title?: string
  description?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  maxHeight?: string
  withBackdrop?: boolean
  preventBodyScroll?: boolean
  onOpenChange?: (open: boolean) => void
}

function PopoverContent({
  className = "",
  align = "center",
  side = "bottom",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = 40,
  sticky = "always",
  title,
  description,
  maxWidth = "md",
  maxHeight = "90vh",
  withBackdrop = false,
  preventBodyScroll = false,
  ...props
}: PopoverContentProps) {
  const isCalendarPopover = className?.includes('p-0') || className?.includes('calendar');
  const isDialogStyle = title || withBackdrop;
  
  // Handle body overflow when using dialog-like style
  useEffect(() => {
    if (preventBodyScroll) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [preventBodyScroll]);
  
  if (isDialogStyle) {
    return (
      <PopoverPrimitive.Portal>
        {withBackdrop && (
          <div 
            className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm" 
            onClick={() => props.onOpenChange?.(false)}
          />
        )}
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div 
            className={cn(
              "pointer-events-auto w-full bg-background/90 backdrop-blur-xl backdrop-saturate-150 rounded-lg border border-border/40 shadow-lg shadow-primary/10 mx-4 overflow-auto",
              maxWidthMap[maxWidth],
            )}
            style={{ maxHeight }}
          >
            {title && (
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
                  onClick={() => props.onOpenChange?.(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className={title ? "p-6" : ""}>
              {props.children}
            </div>
          </div>
        </div>
      </PopoverPrimitive.Portal>
    );
  }
  
  // Original popover implementation for standard usage
  return (
    <PopoverPrimitive.Portal container={
      typeof document !== 'undefined' ? document.getElementById('popover-portal') : undefined
    }>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        sticky={sticky}
        avoidCollisions={true}
        className={cn(
          "relative z-[100] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "max-h-[80vh] overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Special styles for calendar popovers
          isCalendarPopover && "p-0 max-h-none max-w-none w-auto",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor(props: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
