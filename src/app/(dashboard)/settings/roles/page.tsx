import { prisma } from "@/lib/prisma"
import { RolesClient } from "./roles-client"

export default async function RolesPage() {
  // Fetch roles with their permissions
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Fetch all available permissions
  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return <RolesClient roles={roles} permissions={permissions} />
} 