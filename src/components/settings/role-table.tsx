"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Role, Permission } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, ShieldCheck } from "lucide-react"
import { RoleFormDialog } from "./role-form-dialog"
import { RoleDeleteDialog } from "./role-delete-dialog"
import { toast } from "@/components/ui/use-toast"

interface MenuPermission {
  category: string
  permissions: Array<
    | { name: string; description: string }
    | { subcategory: string; permissions: Array<{ name: string; description: string }> }
  >
}

interface RoleTableProps {
  roles: (Role & {
    permissions: Permission[]
    _count: {
      users: number
    }
  })[]
  permissions: Permission[]
  menuPermissions: MenuPermission[]
}

export function RoleTable({ roles, permissions, menuPermissions }: RoleTableProps) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<(Role & { permissions: Permission[] }) | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const getPermissionCount = (role: Role & { permissions: Permission[] }) => {
    return role.permissions.length
  }

  const handleEdit = (role: Role & { permissions: Permission[] }) => {
    setSelectedRole(role)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      toast({
        title: "Error",
        description: "System roles cannot be deleted",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/settings/roles/${role.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No roles found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  {role.isAdmin ? (
                    <Badge className="bg-amber-500 text-white">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Regular
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {role._count.users} user{role._count.users !== 1 && "s"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission.id} variant="outline">
                        {permission.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(role)}
                      disabled={role.isSystem}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(role)}
                      disabled={role.isSystem}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RoleFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        role={selectedRole}
        permissions={permissions}
        menuPermissions={menuPermissions}
        onSuccess={() => window.location.reload()}
      />

      <RoleDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        role={selectedRole}
      />
    </>
  )
} 