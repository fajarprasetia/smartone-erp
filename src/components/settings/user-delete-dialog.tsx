"use client"

import { useRouter } from "next/navigation"
import { User } from "@prisma/client"
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

interface UserDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  user,
}: UserDeleteDialogProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!user) return

    try {
      const response = await fetch(`/api/settings/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {user?.name}? This action cannot be
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