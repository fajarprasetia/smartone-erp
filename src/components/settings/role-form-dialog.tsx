"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Role, Permission } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, X } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isAdmin: z.boolean(),
  isSystem: z.boolean(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const [category] = permission.name.split('.')
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isAdmin: false,
      isSystem: false,
      permissionIds: [],
    },
  })

  useEffect(() => {
    if (open && role) {
      form.reset({
        name: role.name,
        description: role.description || "",
        isAdmin: role.isAdmin,
        isSystem: role.isSystem,
        permissionIds: role.permissions.map(p => p.id),
      })
    } else if (!open) {
      form.reset({
        name: "",
        description: "",
        isAdmin: false,
        isSystem: false,
        permissionIds: [],
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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-semibold">
              {role ? "Edit Role" : "Create Role"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {role ? "Update role details and permissions" : "Create a new role with specific permissions"}
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

        <div className="p-6 space-y-6">
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
                      <p className="text-sm text-muted-foreground">
                        This role will have access to all permissions
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isSystem"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={role?.isSystem}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>System Role</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This role cannot be deleted and is required for system operation
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Permissions</FormLabel>
                <div className="space-y-2">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <Collapsible
                      key={category}
                      open={expandedCategories.includes(category)}
                      onOpenChange={() => toggleCategory(category)}
                      className="space-y-2"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent">
                        <span className="font-medium">{category}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedCategories.includes(category) && "rotate-180"
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 pl-4">
                        {categoryPermissions.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissionIds"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || []
                                      if (checked) {
                                        field.onChange([...current, permission.id])
                                      } else {
                                        field.onChange(
                                          current.filter((value) => value !== permission.id)
                                        )
                                      }
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-normal">
                                    {permission.name}
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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
        </div>
      </div>
    </div>
  )
} 