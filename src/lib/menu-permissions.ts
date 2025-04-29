import { mainNavItems } from "@/components/layout/main-nav"

export interface Permission {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
}

export function getMenuPermissions(): Permission[] {
  const permissions: Permission[] = []

  mainNavItems.forEach((item) => {
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
        // Add subcategory view permission
        permissions.push({
          id: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.view`,
          name: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.view`,
          description: `View ${subItem.title}`,
          category: item.title,
          subcategory: subItem.title,
        })

        // Add subcategory edit permission
        permissions.push({
          id: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.edit`,
          name: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.edit`,
          description: `Edit ${subItem.title}`,
          category: item.title,
          subcategory: subItem.title,
        })

        // Handle nested submenus
        if (subItem.items) {
          subItem.items.forEach((nestedItem) => {
            permissions.push({
              id: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.${nestedItem.title.toLowerCase()}.view`,
              name: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.${nestedItem.title.toLowerCase()}.view`,
              description: `View ${nestedItem.title}`,
              category: item.title,
              subcategory: `${subItem.title} > ${nestedItem.title}`,
            })

            permissions.push({
              id: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.${nestedItem.title.toLowerCase()}.edit`,
              name: `${item.title.toLowerCase()}.${subItem.title.toLowerCase()}.${nestedItem.title.toLowerCase()}.edit`,
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