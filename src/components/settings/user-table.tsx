"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Role } from "@prisma/client"
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
import { Pencil, Trash2, Key } from "lucide-react"
import { UserFormDialog } from "./user-form-dialog"
import { UserDeleteDialog } from "./user-delete-dialog"
import { PasswordResetDialog } from "./password-reset-dialog"
import { toast } from "@/components/ui/use-toast"

interface UserTableProps {
  users: (User & {
    role: Role
  })[]
  roles: Role[]
}

export function UserTable({ users, roles }: UserTableProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleteDialogOpen(true)

    try {
      const response = await fetch(`/api/settings/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No users found.</p>
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
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role.name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user)
                        setIsEditDialogOpen(true)
                      }}
                      disabled={user.email === "systemadministrator@smartone.id"}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user)
                        setIsPasswordResetDialogOpen(true)
                      }}
                      disabled={user.email === "systemadministrator@smartone.id"}
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(user)
                        setIsDeleteDialogOpen(true)
                      }}
                      disabled={user.role.name === "System Administrator"}
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

      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        roles={roles}
      />

      <PasswordResetDialog
        open={isPasswordResetDialogOpen}
        onOpenChange={setIsPasswordResetDialogOpen}
        user={selectedUser}
      />

      <UserDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
      />
    </>
  )
} 