"use client"

import { useRouter } from "next/navigation"
import { Role } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface RoleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

export function RoleDeleteDialog({
  open,
  onOpenChange,
  role,
}: RoleDeleteDialogProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!role) return

    try {
      const response = await fetch(`/api/settings/roles/${role.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete role")
      }

      toast({
        title: "Success",
        description: "Role deleted successfully.",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {role?.name}? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 