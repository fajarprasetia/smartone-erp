"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  FileText,
  Palette,
  Factory,
  Printer,
  Scissors,
  DollarSign,
  BarChart3,
  Receipt,
  Wallet,
  BookOpen,
  PiggyBank,
  FileSpreadsheet,
  Settings,
  User,
  Shield,
  ChevronDown,
  MessageSquare,
  MessageSquarePlus,
  MessageSquareReply,
  Clipboard,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  items?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "Manager",
    href: "/manager",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Marketing",
    href: "/marketing",
    icon: <MessageSquare className="h-4 w-4" />,
    items: [
      {
        title: "Customer",
        href: "/marketing/customer",
        icon: <MessageSquarePlus className="h-4 w-4" />,
      },
      {
        title: "WhatsApp",
        href: "/marketing/whatsapp",
        icon: <MessageSquareReply className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: <Package className="h-4 w-4" />,
    items: [
      {
        title: "Inbound",
        href: "/inventory/inbound",
        icon: <Clipboard className="h-4 w-4" />,
      },
      {
        title: "Outbound",
        href: "/inventory/outbound",
        icon: <Clipboard className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Order",
    href: "/order",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    title: "Design",
    href: "/design",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    title: "Production",
    href: "/production",
    icon: <Factory className="h-4 w-4" />,
    items: [
      {
        title: "Production List",
        href: "/production/list",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: "Print",
        href: "/production/print",
        icon: <Printer className="h-4 w-4" />,
      },
      {
        title: "Press",
        href: "/production/press",
        icon: <Factory className="h-4 w-4" />,
      },
      {
        title: "Cutting",
        href: "/production/cutting",
        icon: <Scissors className="h-4 w-4" />,
      },
      {
        title: "DTF",
        href: "/production/dtf",
        icon: <FileText className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Finance",
    href: "/finance",
    icon: <DollarSign className="h-4 w-4" />,
    items: [
      {
        title: "Overview",
        href: "/finance/overview",
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        title: "Accounts Receivable",
        href: "/finance/receivable",
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        title: "Accounts Payable",
        href: "/finance/payable",
        icon: <Wallet className="h-4 w-4" />,
      },
      {
        title: "Cash Management",
        href: "/finance/cash",
        icon: <PiggyBank className="h-4 w-4" />,
      },
      {
        title: "General Ledger",
        href: "/finance/ledger",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        title: "Budgets",
        href: "/finance/budgets",
        icon: <FileSpreadsheet className="h-4 w-4" />,
      },
      {
        title: "Tax Management",
        href: "/finance/tax",
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        title: "Reports",
        href: "/finance/reports",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    items: [
      {
        title: "Dashboard",
        href: "/settings/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        title: "Products",
        href: "/settings/products",
        icon: <Package className="h-4 w-4" />,
      },
      {
        title: "Users",
        href: "/settings/users",
        icon: <User className="h-4 w-4" />,
      },
      {
        title: "Roles",
        href: "/settings/roles",
        icon: <Shield className="h-4 w-4" />,
      },
    ],
  },
]

export function MainNav({ isCollapsed = false }) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const isSubmenuActive = (items?: NavItem[]) => {
    if (!items) return false
    return items.some(item => isActive(item.href))
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <nav className="space-y-1 p-2">
        {navItems.map((item) => (
          <div key={item.title}>
            {item.items ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(item.href) || isSubmenuActive(item.items)
                      ? "bg-primary/20 text-white font-bold"
                      : "hover:bg-white/10 text-white"
                  )}
                >
                  {isCollapsed ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-center">
                            {item.icon}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedItems.includes(item.title) && "rotate-180"
                      )}
                    />
                  )}
                </button>
                {expandedItems.includes(item.title) && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive(subItem.href)
                            ? "bg-primary/20 text-white font-bold"
                            : "hover:bg-white/10 text-white/90"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          {subItem.icon}
                          <span>{subItem.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-primary/20 text-white font-bold"
                    : "hover:bg-white/10 text-white"
                )}
              >
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center justify-center">
                          {item.icon}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
} 