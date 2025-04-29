"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverPortal = PopoverPrimitive.Portal

const PopoverClose = PopoverPrimitive.Close

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    side?: "top" | "bottom" | "left" | "right" | "center"
    align?: "start" | "center" | "end"
  }
>(({ className, children, side = "center", align = "center", ...props }, ref) => {
  return (
    <PopoverPortal>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl backdrop-saturate-150" />
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        data-side={side}
        data-align={align}
        className={cn(
          "fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/40 shadow-lg shadow-primary/10 bg-background/90 p-6 backdrop-blur-xl backdrop-saturate-150 duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {children}
        <PopoverPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </PopoverPrimitive.Close>
      </PopoverPrimitive.Content>
    </PopoverPortal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverFooter,
  PopoverTitle,
  PopoverDescription,
  PopoverPortal,
  PopoverClose,
} 