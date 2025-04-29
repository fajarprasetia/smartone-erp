import { Permission } from "@prisma/client"

export function hasPermission(userPermissions: any[] | undefined, permissionName: string): boolean {
  // If no permissions provided, return false
  if (!userPermissions || !Array.isArray(userPermissions)) return false

  // For dashboard view, always allow access
  if (permissionName === "dashboard.view") return true

  // Check if user has the specific permission
  const hasSpecificPermission = userPermissions.some(
    (permission) => permission.name === permissionName
  )

  // Check for admin permissions
  const hasAdminPermission = userPermissions.some(
    (permission) => permission.name === "admin"
  )

  // Check if any permission has isAdmin flag
  const userIsAdmin = userPermissions.some(
    permission => permission.isAdmin === true
  )

  // Split the permission into segments to check for wildcard matches at various levels
  const permissionParts = permissionName.split(".")
  const category = permissionParts[0]
  
  // Check for category wildcard (e.g., "production.*")
  const hasCategoryWildcard = userPermissions.some(
    (permission) => permission.name === `${category}.*`
  )
  
  // Check for subcategory wildcard (e.g., "production.print.*")
  let hasSubcategoryWildcard = false
  if (permissionParts.length >= 2) {
    const subcategory = `${permissionParts[0]}.${permissionParts[1]}`
    hasSubcategoryWildcard = userPermissions.some(
      (permission) => permission.name === `${subcategory}.*`
    )
  }

  return hasSpecificPermission || hasAdminPermission || hasCategoryWildcard || hasSubcategoryWildcard || userIsAdmin
}

export function hasRole(user: any, roleName: string): boolean {
  return user?.role?.name === roleName
}

export function canAccessMenuItem(userPermissions: any[] | undefined, path: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false

  // Dashboard is always accessible
  if (path === "/dashboard") return true

  // Define the permission map for menu paths
  const permissionMap: Record<string, string> = {
    "/dashboard": "dashboard.view",
    "/manager": "manager.view",
    "/marketing": "marketing.view",
    "/marketing/customer": "marketing.customer.view",
    "/marketing/whatsapp": "marketing.whatsapp.view",
    "/marketing/whatsapp/chat": "marketing.whatsapp_chat.view",
    "/inventory": "inventory.view",
    "/inventory/inbound": "inventory.inbound.view",
    "/inventory/outbound": "inventory.outbound.view",
    "/inventory/consumables": "inventory.consumables.view",
    "/inventory/assets": "inventory.assets.view",
    "/order": "order.view",
    "/design": "design.view",
    "/production": "production.view",
    "/production/list": "production.list.view",
    "/production/print": "production.print.view",
    "/production/press": "production.press.view",
    "/production/cutting": "production.cutting.view",
    "/production/dtf": "production.dtf.view",
    "/finance": "finance.view",
    "/finance/overview": "finance.overview.view",
    "/finance/receivable": "finance.receivable.view",
    "/finance/payable": "finance.payable.view",
    "/finance/cash": "finance.cash.view",
    "/finance/ledger": "finance.ledger.view",
    "/finance/budgets": "finance.budgets.view",
    "/finance/tax": "finance.tax.view",
    "/finance/reports": "finance.reports.view",
    "/settings": "settings.view",
    "/settings/dashboard": "settings.dashboard.view",
    "/settings/products": "settings.products.view",
    "/settings/users": "settings.users.view",
    "/settings/roles": "settings.roles.view",
  }

  // Get the required permission for the path
  const requiredPermission = permissionMap[path]

  // If no permission is required for this path, don't allow access by default
  if (!requiredPermission) return false

  // Check if user has the required permission
  return hasPermission(userPermissions, requiredPermission)
}

export function getMenuPermissions() {
  return [
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
            { name: "marketing.whatsapp.edit", description: "Edit WhatsApp" }
          ]
        },
        {
          subcategory: "WhatsApp Chat",
          permissions: [
            { name: "marketing.whatsapp_chat.view", description: "View WhatsApp Chat" },
            { name: "marketing.whatsapp_chat.edit", description: "Edit WhatsApp Chat" }
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
        }
      ]
    }
  ]
} 