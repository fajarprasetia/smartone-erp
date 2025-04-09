"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

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
}

function PopoverContent({
  className = "",
  align = "center",
  side = "bottom",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = 40,
  sticky = "always",
  ...props
}: PopoverContentProps) {
  // Check if the className indicates this is likely a calendar popover
  const isCalendarPopover = className?.includes('p-0') || className?.includes('calendar');
  
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
