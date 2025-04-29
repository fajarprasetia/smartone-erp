"use client"

// This file re-exports our custom popover components with the same names
// as the original Radix UI popover components, allowing for easier substitution

import { 
  CustomPopover,
  CustomPopoverContent,
  CustomPopoverTrigger
} from "./custom-popover"

// Export with the original Radix UI component names
export {
  CustomPopover as Popover,
  CustomPopoverContent as PopoverContent,
  CustomPopoverTrigger as PopoverTrigger
} 