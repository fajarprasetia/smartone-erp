"use client"

import { useState } from "react"
import { Role, Permission } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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

export function RolesClient({ roles, permissions }: RolesClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<(Role & { permissions: Permission[] }) | null>(null)

  const handleEditRole = (role: Role & { permissions: Permission[] }) => {
    setSelectedRole(role)
    setIsDialogOpen(true)
  }

  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Create and manage roles to control user permissions.
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div>
        <RoleTable 
          roles={roles} 
          permissions={permissions}
          onEditRole={handleEditRole}
        />
      </div>

      <RoleFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        role={selectedRole}
        permissions={permissions}
      />
    </div>
  )
} 