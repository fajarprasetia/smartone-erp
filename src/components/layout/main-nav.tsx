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
  Calendar,
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
import { Permission } from "@prisma/client"
import { hasPermission } from "@/lib/permissions"

interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  items?: NavItem[]
  permission?: string
}

interface MainNavProps {
  isCollapsed?: boolean
  userPermissions: Permission[] | undefined
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    permission: "dashboard.view"
  },
  {
    title: "Manager",
    href: "/manager",
    icon: <Users className="h-4 w-4" />,
    permission: "manager.view"
  },
  {
    title: "Marketing",
    href: "/marketing",
    icon: <MessageSquare className="h-4 w-4" />,
    permission: "marketing.view",
    items: [
      {
        title: "Customer",
        href: "/marketing/customer",
        icon: <MessageSquarePlus className="h-4 w-4" />,
        permission: "marketing.customer.view"
      },
      {
        title: "WhatsApp",
        href: "/marketing/whatsapp",
        icon: <MessageSquare className="h-4 w-4" />,
        permission: "marketing.whatsapp.view"
      },
      {
        title: "WhatsApp Chat",
        href: "/marketing/whatsapp/chat",
        icon: <MessageSquareReply className="h-4 w-4" />,
        permission: "marketing.whatsapp_chat.view"
      }
    ]
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: <Package className="h-4 w-4" />,
    permission: "inventory.view",
    items: [
      {
        title: "Inbound",
        href: "/inventory/inbound",
        icon: <Clipboard className="h-4 w-4" />,
        permission: "inventory.inbound.view"
      },
      {
        title: "Outbound",
        href: "/inventory/outbound",
        icon: <Clipboard className="h-4 w-4" />,
        permission: "inventory.outbound.view"
      },
      {
        title: "Consumables",
        href: "/inventory/consumables",
        icon: <Package className="h-4 w-4" />,
        permission: "inventory.consumables.view"
      },
      {
        title: "Assets",
        href: "/inventory/assets",
        icon: <Package className="h-4 w-4" />,
        permission: "inventory.assets.view"
      }
    ]
  },
  {
    title: "Order",
    href: "/order",
    icon: <ShoppingCart className="h-4 w-4" />,
    permission: "order.view"
  },
  {
    title: "Design",
    href: "/design",
    icon: <Palette className="h-4 w-4" />,
    permission: "design.view"
  },
  {
    title: "Production",
    href: "/production",
    icon: <Factory className="h-4 w-4" />,
    permission: "production.view",
    items: [
      {
        title: "Production List",
        href: "/production/list",
        icon: <FileText className="h-4 w-4" />,
        permission: "production.list.view"
      },
      {
        title: "Print",
        href: "/production/print",
        icon: <Printer className="h-4 w-4" />,
        permission: "production.print.view"
      },
      {
        title: "Press",
        href: "/production/press",
        icon: <Factory className="h-4 w-4" />,
        permission: "production.press.view"
      },
      {
        title: "Cutting",
        href: "/production/cutting",
        icon: <Scissors className="h-4 w-4" />,
        permission: "production.cutting.view"
      },
      {
        title: "DTF",
        href: "/production/dtf",
        icon: <FileText className="h-4 w-4" />,
        permission: "production.dtf.view"
      }
    ]
  },
  {
    title: "Finance",
    href: "/finance",
    icon: <DollarSign className="h-4 w-4" />,
    permission: "finance.view",
    items: [
      {
        title: "Overview",
        href: "/finance/overview",
        icon: <BarChart3 className="h-4 w-4" />,
        permission: "finance.overview.view"
      },
      {
        title: "Accounts Receivable",
        href: "/finance/receivable",
        icon: <Receipt className="h-4 w-4" />,
        permission: "finance.receivable.view"
      },
      {
        title: "Accounts Payable",
        href: "/finance/payable",
        icon: <Wallet className="h-4 w-4" />,
        permission: "finance.payable.view"
      },
      {
        title: "Cash Management",
        href: "/finance/cash",
        icon: <PiggyBank className="h-4 w-4" />,
        permission: "finance.cash.view"
      },
      {
        title: "General Ledger",
        href: "/finance/ledger",
        icon: <BookOpen className="h-4 w-4" />,
        permission: "finance.ledger.view"
      },
      {
        title: "Budgets",
        href: "/finance/budgets",
        icon: <FileSpreadsheet className="h-4 w-4" />,
        permission: "finance.budgets.view"
      },
      {
        title: "Tax Management",
        href: "/finance/tax",
        icon: <Receipt className="h-4 w-4" />,
        permission: "finance.tax.view"
      },
      {
        title: "Reports",
        href: "/finance/reports",
        icon: <BarChart3 className="h-4 w-4" />,
        permission: "finance.reports.view"
      }
    ]
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    permission: "settings.view",
    items: [
      {
        title: "Dashboard",
        href: "/settings/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        permission: "settings.dashboard.view"
      },
      {
        title: "Products",
        href: "/settings/products",
        icon: <Package className="h-4 w-4" />,
        permission: "settings.products.view"
      },
      {
        title: "Users",
        href: "/settings/users",
        icon: <Users className="h-4 w-4" />,
        permission: "settings.users.view"
      },
      {
        title: "Roles",
        href: "/settings/roles",
        icon: <Shield className="h-4 w-4" />,
        permission: "settings.roles.view"
      }
    ]
  }
]

export { navItems }

export function MainNav({ isCollapsed = false, userPermissions }: MainNavProps) {
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

  // Check if user has permission for a specific menu item or any of its children
  const hasMenuItemPermission = (item: NavItem): boolean => {
    // Dashboard is always visible
    if (item.title === "Dashboard") return true
    
    // If the item has a permission requirement, check if the user has it
    if (item.permission && !hasPermission(userPermissions, item.permission)) {
      // If the item has children, check if the user has permission for any child
      if (item.items) {
        return item.items.some(subItem => hasMenuItemPermission(subItem))
      }
      return false
    }
    
    return true
  }

  const renderNavItem = (item: NavItem) => {
    // Dashboard is always visible
    if (item.title === "Dashboard") {
      return (
        <Link
          key={item.title}
          href={item.href}
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
            isActive(item.href)
              ? "bg-primary/20 text-black font-bold"
              : "hover:bg-white/10 text-black"
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
      )
    }

    // Check if user has direct permission for this item or any of its children
    if (!hasMenuItemPermission(item)) {
      return null
    }

    if (item.items) {
      // Filter out items that user doesn't have permission for
      const filteredItems = item.items.filter(subItem => 
        hasMenuItemPermission(subItem)
      )

      // Don't render parent if no children are visible
      if (filteredItems.length === 0) {
        return null
      }

      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive(item.href) || isSubmenuActive(filteredItems)
                ? "bg-primary/20 text-black font-bold"
                : "hover:bg-white/10 text-black"
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
                  expandedItems.includes(item.title) || isSubmenuActive(filteredItems) ? "rotate-180" : ""
                )}
              />
            )}
          </button>
          {(expandedItems.includes(item.title) || isSubmenuActive(filteredItems)) && (
            <div className={cn(
              "mt-1 space-y-1",
              isCollapsed ? "ml-0" : "ml-4"
            )}>
              {filteredItems.map((subItem) => renderNavItem(subItem))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive(item.href)
            ? "bg-primary/20 text-black font-bold"
            : "hover:bg-white/10 text-black"
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
    )
  }

  // Set initial expanded state based on active path
  React.useEffect(() => {
    // Expand parent menu if a child route is active
    const parentWithActiveChild = navItems.find(item => 
      item.items && item.items.some(subItem => isActive(subItem.href))
    )
    
    if (parentWithActiveChild && !expandedItems.includes(parentWithActiveChild.title)) {
      setExpandedItems(prev => [...prev, parentWithActiveChild.title])
    }
  }, [pathname])

  return (
    <ScrollArea className="h-full">
      <nav className="space-y-1">
        {navItems.map((item) => renderNavItem(item))}
      </nav>
    </ScrollArea>
  )
} 