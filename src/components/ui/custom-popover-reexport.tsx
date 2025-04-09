"use client"

// This file re-exports our custom popover components with the same names
// as the original Radix UI popover components, allowing for easier substitution

import { 
  CustomPopover,
  CustomPopoverContent,
  CustomPopoverTrigger
} from "./custom-popover"

// Re-export with the original Radix UI component names
export const Popover = CustomPopover
export const PopoverContent = CustomPopoverContent
export const PopoverTrigger = CustomPopoverTrigger

// Also export as a named object for consistency with the original
export {
  Popover,
  PopoverContent,
  PopoverTrigger
} 