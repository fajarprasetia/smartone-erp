"use client"

import { useState } from "react"
import { Role, Permission } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ShieldPlus } from "lucide-react"
import { RoleTable } from "@/components/settings/role-table"
import { RoleFormDialog } from "@/components/settings/role-form-dialog"

interface RolesClientProps {
  roles: (Role & {
    permissions: Permission[]
    _count: {
      users: number
    }
  })[]
  permissions: Permission[]
}

interface MenuPermission {
  category: string
  permissions: Array<
    | { name: string; description: string }
    | { subcategory: string; permissions: Array<{ name: string; description: string }> }
  >
}

const menuPermissions: MenuPermission[] = [
  {
    category: "Dashboard",
    permissions: [
      { name: "dashboard.view", description: "View Dashboard" }
    ]
  },
  {
    category: "Manager",
    permissions: [
      { name: "manager.view", description: "View Manager" },
      { name: "manager.edit", description: "Edit Manager" }
    ]
  },
  {
    category: "Marketing",
    permissions: [
      { name: "marketing.view", description: "View Marketing" },
      { name: "marketing.edit", description: "Edit Marketing" },
      {
        subcategory: "Customer",
        permissions: [
          { name: "marketing.customer.view", description: "View Customers" },
          { name: "marketing.customer.edit", description: "Edit Customers" }
        ]
      },
      {
        subcategory: "WhatsApp",
        permissions: [
          { name: "marketing.whatsapp.view", description: "View WhatsApp" },
          { name: "marketing.whatsapp.edit", description: "Edit WhatsApp" },
          { name: "marketing.whatsapp.templates.view", description: "View Templates" },
          { name: "marketing.whatsapp.templates.edit", description: "Edit Templates" },
          { name: "marketing.whatsapp.chat.view", description: "View Chat" },
          { name: "marketing.whatsapp.chat.edit", description: "Edit Chat" }
        ]
      }
    ]
  },
  {
    category: "Inventory",
    permissions: [
      { name: "inventory.view", description: "View Inventory" },
      { name: "inventory.edit", description: "Edit Inventory" },
      {
        subcategory: "Inbound",
        permissions: [
          { name: "inventory.inbound.view", description: "View Inbound" },
          { name: "inventory.inbound.edit", description: "Edit Inbound" }
        ]
      },
      {
        subcategory: "Outbound",
        permissions: [
          { name: "inventory.outbound.view", description: "View Outbound" },
          { name: "inventory.outbound.edit", description: "Edit Outbound" }
        ]
      },
      {
        subcategory: "Consumables",
        permissions: [
          { name: "inventory.consumables.view", description: "View Consumables" },
          { name: "inventory.consumables.edit", description: "Edit Consumables" }
        ]
      },
      {
        subcategory: "Assets",
        permissions: [
          { name: "inventory.assets.view", description: "View Assets" },
          { name: "inventory.assets.edit", description: "Edit Assets" }
        ]
      }
    ]
  },
  {
    category: "Order",
    permissions: [
      { name: "order.view", description: "View Orders" },
      { name: "order.edit", description: "Edit Orders" }
    ]
  },
  {
    category: "Design",
    permissions: [
      { name: "design.view", description: "View Design" },
      { name: "design.edit", description: "Edit Design" }
    ]
  },
  {
    category: "Production",
    permissions: [
      { name: "production.view", description: "View Production" },
      { name: "production.edit", description: "Edit Production" },
      {
        subcategory: "Production List",
        permissions: [
          { name: "production.list.view", description: "View Production List" },
          { name: "production.list.edit", description: "Edit Production List" }
        ]
      },
      {
        subcategory: "Print",
        permissions: [
          { name: "production.print.view", description: "View Print" },
          { name: "production.print.edit", description: "Edit Print" }
        ]
      },
      {
        subcategory: "Press",
        permissions: [
          { name: "production.press.view", description: "View Press" },
          { name: "production.press.edit", description: "Edit Press" }
        ]
      },
      {
        subcategory: "Cutting",
        permissions: [
          { name: "production.cutting.view", description: "View Cutting" },
          { name: "production.cutting.edit", description: "Edit Cutting" }
        ]
      },
      {
        subcategory: "DTF",
        permissions: [
          { name: "production.dtf.view", description: "View DTF" },
          { name: "production.dtf.edit", description: "Edit DTF" }
        ]
      }
    ]
  },
  {
    category: "Finance",
    permissions: [
      { name: "finance.view", description: "View Finance" },
      { name: "finance.edit", description: "Edit Finance" },
      {
        subcategory: "Overview",
        permissions: [
          { name: "finance.overview.view", description: "View Overview" },
          { name: "finance.overview.edit", description: "Edit Overview" }
        ]
      },
      {
        subcategory: "Accounts Receivable",
        permissions: [
          { name: "finance.receivable.view", description: "View Receivables" },
          { name: "finance.receivable.edit", description: "Edit Receivables" }
        ]
      },
      {
        subcategory: "Accounts Payable",
        permissions: [
          { name: "finance.payable.view", description: "View Payables" },
          { name: "finance.payable.edit", description: "Edit Payables" }
        ]
      },
      {
        subcategory: "Cash Management",
        permissions: [
          { name: "finance.cash.view", description: "View Cash Management" },
          { name: "finance.cash.edit", description: "Edit Cash Management" }
        ]
      },
      {
        subcategory: "General Ledger",
        permissions: [
          { name: "finance.ledger.view", description: "View General Ledger" },
          { name: "finance.ledger.edit", description: "Edit General Ledger" }
        ]
      },
      {
        subcategory: "Budgets",
        permissions: [
          { name: "finance.budgets.view", description: "View Budgets" },
          { name: "finance.budgets.edit", description: "Edit Budgets" }
        ]
      },
      {
        subcategory: "Tax Management",
        permissions: [
          { name: "finance.tax.view", description: "View Tax Management" },
          { name: "finance.tax.edit", description: "Edit Tax Management" }
        ]
      },
      {
        subcategory: "Reports",
        permissions: [
          { name: "finance.reports.view", description: "View Reports" },
          { name: "finance.reports.edit", description: "Edit Reports" }
        ]
      }
    ]
  },
  {
    category: "Settings",
    permissions: [
      { name: "settings.view", description: "View Settings" },
      { name: "settings.edit", description: "Edit Settings" },
      {
        subcategory: "Dashboard",
        permissions: [
          { name: "settings.dashboard.view", description: "View Dashboard Settings" },
          { name: "settings.dashboard.edit", description: "Edit Dashboard Settings" }
        ]
      },
      {
        subcategory: "Users",
        permissions: [
          { name: "settings.users.view", description: "View Users" },
          { name: "settings.users.edit", description: "Edit Users" }
        ]
      },
      {
        subcategory: "Roles",
        permissions: [
          { name: "settings.roles.view", description: "View Roles" },
          { name: "settings.roles.edit", description: "Edit Roles" }
        ]
      },
      {
        subcategory: "WhatsApp",
        permissions: [
          { name: "settings.whatsapp.view", description: "View WhatsApp Settings" },
          { name: "settings.whatsapp.edit", description: "Edit WhatsApp Settings" }
        ]
      }
    ]
  }
]

export function RolesClient({ roles, permissions }: RolesClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Create and manage roles to control user permissions.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <ShieldPlus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <div>
        <RoleTable 
          roles={roles} 
          permissions={permissions}
          menuPermissions={menuPermissions}
        />
      </div>

      <RoleFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        permissions={permissions}
        menuPermissions={menuPermissions}
      />
    </div>
  )
} 