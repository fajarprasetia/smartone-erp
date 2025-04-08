"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { User, Role } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }).optional(),
  roleId: z.string({
    required_error: "Please select a role.",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  roles: Role[]
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
}: UserFormDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  })

  // Reset form with user data when dialog opens or user changes
  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name || "",
        email: user.email,
        roleId: user.roleId,
      })
    } else if (!open) {
      form.reset({
        name: "",
        email: "",
        password: "",
        roleId: "",
      })
    }
  }, [open, user, form])

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(
        user ? `/api/settings/users/${user.id}` : "/api/settings/users",
        {
          method: user ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to save user")
      }

      toast({
        title: "Success",
        description: `User ${user ? "updated" : "created"} successfully.`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if the user is the system administrator
  const isSystemAdmin = user?.email === "systemadministrator@smartone.id"

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update the user's information."
              : "Add a new user to the system."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The full name of the user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email address"
                      type="email"
                      {...field}
                      disabled={user?.email === "systemadministrator@smartone.id"}
                    />
                  </FormControl>
                  <FormDescription>
                    The email address for the user account.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!user && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The password for the user account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={user?.email === "systemadministrator@smartone.id"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The role assigned to the user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? user
                    ? "Updating..."
                    : "Creating..."
                  : user
                  ? "Update User"
                  : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 