"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Role, Permission } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
  isAdmin: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: (Role & { permissions: Permission[] }) | null
  permissions: Permission[]
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  permissions,
}: RoleFormDialogProps) {
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
      description: "",
      permissionIds: [],
      isAdmin: false,
    },
  })

  // Reset form with role data when dialog opens or role changes
  useEffect(() => {
    if (open && role) {
      form.reset({
        name: role.name,
        description: role.description || "",
        permissionIds: role.permissions.map((p: Permission) => p.id),
        isAdmin: role.isAdmin || false,
      })
    } else if (!open) {
      form.reset({
        name: "",
        description: "",
        permissionIds: [],
        isAdmin: false,
      })
    }
  }, [open, role, form])

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const response = await fetch(
        role ? `/api/settings/roles/${role.id}` : "/api/settings/roles",
        {
          method: role ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to save role")
      }

      toast({
        title: "Success",
        description: `Role ${role ? "updated" : "created"} successfully`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if the role is a system role
  const isSystemRole = role?.isSystem

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background z-50 rounded-lg border shadow-lg w-full max-w-lg mx-4 overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {role ? "Edit Role" : "Create Role"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {role
                ? "Edit role details below"
                : "Fill in the details to create a new role"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {isSystemRole ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                System roles cannot be edited.
              </p>
              <Button
                className="mt-4"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter role name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter role description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissionIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={permissions.map((p) => ({
                            label: p.name,
                            value: p.id,
                          }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select permissions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Administrator Role</FormLabel>
                        <FormDescription>
                          This role will have access to administrative features
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div
                  className={cn(
                    "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4"
                  )}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading
                      ? "Saving..."
                      : role
                      ? "Update Role"
                      : "Create Role"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
} 