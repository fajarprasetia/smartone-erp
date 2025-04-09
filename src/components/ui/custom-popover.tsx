"use client"

import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface CustomPopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  contentClassName?: string
  sideOffset?: number
  alignOffset?: number
}

function CustomPopover({
  trigger,
  content,
  open: controlledOpen,
  onOpenChange,
  align = "center",
  side = "bottom",
  className,
  contentClassName,
  sideOffset = 10,
  alignOffset = 0,
}: CustomPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  
  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(open)
    }
    onOpenChange?.(open)
  }
  
  const calculatePosition = () => {
    if (!triggerRef.current || !contentRef.current) return
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    // Space needed for padding at viewport edges
    const viewportPadding = 10
    
    let top = 0
    let left = 0
    
    // Check if this is likely a calendar popover (contains a Calendar component)
    const isCalendarPopover = contentRef.current.querySelector('[class*="rdp"]') !== null ||
                             contentClassName?.includes('max-h-none')
    
    // Determine vertical position with collision handling
    if (side === "top") {
      top = triggerRect.top - contentRect.height - sideOffset
      // If not enough space on top, flip to bottom
      if (top < viewportPadding) {
        top = triggerRect.bottom + sideOffset
      }
    } else if (side === "bottom") {
      top = triggerRect.bottom + sideOffset
      // If not enough space at bottom, flip to top if there's more space there
      if (top + contentRect.height > viewportHeight - viewportPadding) {
        const topSpace = triggerRect.top;
        const bottomSpace = viewportHeight - triggerRect.bottom;
        
        if (topSpace > bottomSpace && topSpace > contentRect.height + sideOffset) {
          top = triggerRect.top - contentRect.height - sideOffset;
        } else {
          // Not enough space on top either
          // For calendars, we want to avoid scrolling if possible by repositioning
          if (isCalendarPopover) {
            // Position as high as possible while keeping it in view
            top = Math.max(viewportPadding, viewportHeight - contentRect.height - viewportPadding);
          } else {
            // For regular content, allow scrolling
            contentRef.current.style.maxHeight = `${viewportHeight - triggerRect.bottom - sideOffset - viewportPadding * 2}px`;
            contentRef.current.style.overflowY = 'auto';
          }
        }
      }
    } else if (side === "left") {
      top = triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2)
      left = triggerRect.left - contentRect.width - sideOffset
      
      // If not enough space on left, flip to right
      if (left < viewportPadding) {
        left = triggerRect.right + sideOffset
      }
    } else if (side === "right") {
      top = triggerRect.top + (triggerRect.height / 2) - (contentRect.height / 2)
      left = triggerRect.right + sideOffset
      
      // If not enough space on right, flip to left
      if (left + contentRect.width > viewportWidth - viewportPadding) {
        left = triggerRect.left - contentRect.width - sideOffset
      }
    }
    
    // Determine horizontal position for top/bottom with better edge handling
    if (side === "top" || side === "bottom") {
      if (align === "start") {
        left = triggerRect.left + alignOffset
      } else if (align === "center") {
        left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2) + alignOffset
      } else if (align === "end") {
        left = triggerRect.right - contentRect.width - alignOffset
      }
      
      // Ensure content stays within viewport horizontally
      if (left < viewportPadding) {
        left = viewportPadding
      } else if (left + contentRect.width > viewportWidth - viewportPadding) {
        left = viewportWidth - contentRect.width - viewportPadding
      }
    }
    
    // Handle vertical overflow for left/right positions
    if ((side === "left" || side === "right") && 
        (top < viewportPadding || top + contentRect.height > viewportHeight - viewportPadding)) {
      
      // Adjust vertically to fit within viewport
      if (contentRect.height <= viewportHeight - viewportPadding * 2) {
        // If content fits in viewport height, center it within available space
        if (top < viewportPadding) {
          top = viewportPadding
        } else if (top + contentRect.height > viewportHeight - viewportPadding) {
          top = viewportHeight - contentRect.height - viewportPadding
        }
      } else {
        // If content is taller than viewport, position at top with scrolling
        top = viewportPadding
        // For calendars, avoid adding scrolling as it can interfere with month navigation
        if (!isCalendarPopover) {
          contentRef.current.style.maxHeight = `${viewportHeight - viewportPadding * 2}px`
          contentRef.current.style.overflowY = 'auto'
        }
      }
    }
    
    setPosition({ top, left })
  }
  
  useEffect(() => {
    if (isOpen) {
      // For calendar popovers, add explicit handling
      if (contentClassName?.includes('calendar') || contentRef.current?.querySelector('[class*="rdp"]')) {
        contentRef.current?.classList.add('calendar-popover');
        
        // Ensure calendar popovers have enough space
        if (contentRef.current) {
          contentRef.current.style.maxHeight = 'none';
          contentRef.current.style.width = 'auto';
          contentRef.current.style.maxWidth = 'none';
        }
      }
      
      // Calculate position after initial render and a bit later to account for animations
      setTimeout(() => {
        calculatePosition()
        setTimeout(calculatePosition, 10)
      }, 0)
      
      const handleScroll = () => calculatePosition()
      const handleResize = () => calculatePosition()
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen])
  
  // Handle click outside to close popover
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        contentRef.current && 
        !triggerRef.current.contains(event.target as Node) && 
        !contentRef.current.contains(event.target as Node)
      ) {
        handleOpenChange(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, handleOpenChange])
  
  // Create portal container if not exists
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    if (!document.getElementById('custom-popover-portal')) {
      const portalContainer = document.createElement('div')
      portalContainer.id = 'custom-popover-portal'
      portalContainer.style.position = 'fixed'
      portalContainer.style.top = '0'
      portalContainer.style.left = '0'
      portalContainer.style.zIndex = '9999'
      portalContainer.style.pointerEvents = 'none'
      document.body.appendChild(portalContainer)
    }
  }, [])
  
  return (
    <>
      <div 
        ref={triggerRef}
        className={cn("inline-block", className)}
        onClick={() => handleOpenChange(!isOpen)}
      >
        {trigger}
      </div>
      
      {isOpen && typeof document !== 'undefined' && (
        createPortal(
          <div
            ref={contentRef}
            className={cn(
              "absolute z-50 bg-white dark:bg-gray-800 rounded-md border border-border shadow-lg",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "pointer-events-auto",
              contentClassName
            )}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              // Don't set fixed max-height by default, let calculatePosition handle it
              maxWidth: 'calc(100vw - 20px)',
            }}
          >
            {content}
          </div>,
          document.getElementById('custom-popover-portal') || document.body
        )
      )}
    </>
  )
}

function CustomPopoverTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

function CustomPopoverContent({ 
  children, 
  className,
  align,
  side,
  sideOffset,
  alignOffset,
 }: {
  children: React.ReactNode,
  className?: string,
  align?: "start" | "center" | "end",
  side?: "top" | "right" | "bottom" | "left",
  sideOffset?: number,
  alignOffset?: number,
}) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

// Export the components as a named export
export { 
  CustomPopover, 
  CustomPopoverTrigger, 
  CustomPopoverContent 
} 