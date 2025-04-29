// Define permission structure
export interface Permission {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
}

// Define navigation structure types
interface NavigationItem {
  title: string
  path: string
  items?: NavigationItem[]
}

// Navigation structure matches the one in main-nav.tsx but without circular imports
const navigationStructure: NavigationItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard"
  },
  {
    title: "Manager",
    path: "/manager"
  },
  {
    title: "Marketing",
    path: "/marketing",
    items: [
      {
        title: "Customer",
        path: "/marketing/customer"
      },
      {
        title: "WhatsApp",
        path: "/marketing/whatsapp"
      },
      {
        title: "WhatsApp Chat",
        path: "/marketing/whatsapp/chat"
      }
    ]
  },
  {
    title: "Inventory",
    path: "/inventory",
    items: [
      {
        title: "Inbound",
        path: "/inventory/inbound"
      },
      {
        title: "Outbound",
        path: "/inventory/outbound"
      },
      {
        title: "Consumables",
        path: "/inventory/consumables"
      },
      {
        title: "Assets",
        path: "/inventory/assets"
      }
    ]
  },
  {
    title: "Order",
    path: "/order"
  },
  {
    title: "Design",
    path: "/design"
  },
  {
    title: "Production",
    path: "/production",
    items: [
      {
        title: "Production List",
        path: "/production/list"
      },
      {
        title: "Print",
        path: "/production/print"
      },
      {
        title: "Press",
        path: "/production/press"
      },
      {
        title: "Cutting",
        path: "/production/cutting"
      },
      {
        title: "DTF",
        path: "/production/dtf"
      }
    ]
  },
  {
    title: "Finance",
    path: "/finance",
    items: [
      {
        title: "Overview",
        path: "/finance/overview"
      },
      {
        title: "Accounts Receivable",
        path: "/finance/receivable"
      },
      {
        title: "Accounts Payable",
        path: "/finance/payable"
      },
      {
        title: "Cash Management",
        path: "/finance/cash"
      },
      {
        title: "General Ledger",
        path: "/finance/ledger"
      },
      {
        title: "Budgets", 
        path: "/finance/budgets"
      },
      {
        title: "Tax Management",
        path: "/finance/tax"
      },
      {
        title: "Reports",
        path: "/finance/reports"
      }
    ]
  },
  {
    title: "Settings",
    path: "/settings",
    items: [
      {
        title: "Dashboard",
        path: "/settings/dashboard"
      },
      {
        title: "Products",
        path: "/settings/products"
      },
      {
        title: "Users",
        path: "/settings/users"
      },
      {
        title: "Roles",
        path: "/settings/roles"
      }
    ]
  }
]

export function getMenuPermissions(): Permission[] {
  const permissions: Permission[] = []

  navigationStructure.forEach((item) => {
    // Add main category permission
    permissions.push({
      id: `${item.title.toLowerCase()}.view`,
      name: `${item.title.toLowerCase()}.view`,
      description: `View ${item.title}`,
      category: item.title,
    })

    // Add edit permission if applicable
    if (item.title !== "Dashboard") {
      permissions.push({
        id: `${item.title.toLowerCase()}.edit`,
        name: `${item.title.toLowerCase()}.edit`,
        description: `Edit ${item.title}`,
        category: item.title,
      })
    }

    // Add submenu permissions
    if (item.items) {
      item.items.forEach((subItem) => {
        // Convert title to permission format (e.g., "Production List" -> "list")
        const permissionName = subItem.title.toLowerCase().replace(/\s+/g, "_")
        
        // Add subcategory view permission
        permissions.push({
          id: `${item.title.toLowerCase()}.${permissionName}.view`,
          name: `${item.title.toLowerCase()}.${permissionName}.view`,
          description: `View ${subItem.title}`,
          category: item.title,
          subcategory: subItem.title,
        })

        // Add subcategory edit permission
        permissions.push({
          id: `${item.title.toLowerCase()}.${permissionName}.edit`,
          name: `${item.title.toLowerCase()}.${permissionName}.edit`,
          description: `Edit ${subItem.title}`,
          category: item.title,
          subcategory: subItem.title,
        })

        // Handle nested submenus if they exist
        if (subItem.items) {
          subItem.items.forEach((nestedItem: NavigationItem) => {
            const nestedPermissionName = nestedItem.title.toLowerCase().replace(/\s+/g, "_")
            
            permissions.push({
              id: `${item.title.toLowerCase()}.${permissionName}.${nestedPermissionName}.view`,
              name: `${item.title.toLowerCase()}.${permissionName}.${nestedPermissionName}.view`,
              description: `View ${nestedItem.title}`,
              category: item.title,
              subcategory: `${subItem.title} > ${nestedItem.title}`,
            })

            permissions.push({
              id: `${item.title.toLowerCase()}.${permissionName}.${nestedPermissionName}.edit`,
              name: `${item.title.toLowerCase()}.${permissionName}.${nestedPermissionName}.edit`,
              description: `Edit ${nestedItem.title}`,
              category: item.title,
              subcategory: `${subItem.title} > ${nestedItem.title}`,
            })
          })
        }
      })
    }
  })

  return permissions
} 