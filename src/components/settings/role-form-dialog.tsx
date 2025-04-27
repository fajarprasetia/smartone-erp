"use client"

import { useState } from "react"
import { Role, Permission } from "@prisma/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Plus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MenuPermission {
  category: string
  permissions: Array<
    | { name: string; description: string }
    | { subcategory: string; permissions: Array<{ name: string; description: string }> }
  >
}

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: (Role & { permissions: Permission[] }) | null
  permissions: Permission[]
  menuPermissions: MenuPermission[]
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  permissions,
  menuPermissions,
  onSuccess,
}: RoleFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissionIds: role?.permissions.map((p) => p.id) || [],
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const url = role 
        ? `/api/settings/roles/${role.id}`
        : '/api/settings/roles'
      
      const method = role ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: role ? "Role updated successfully" : "Role created successfully",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {role ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit Role
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Role
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            {role
              ? "Update the role details and permissions below."
              : "Create a new role and assign permissions below."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter role name" 
                        {...field} 
                        className="h-11"
                      />
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
                    <FormLabel className="text-base font-medium">Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter role description" 
                        {...field} 
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">Permissions</FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allPermissionIds = permissions.map(p => p.id)
                      form.setValue("permissionIds", allPermissionIds)
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue("permissionIds", [])
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[500px] rounded-lg border bg-muted/50 p-4">
                <div className="space-y-8">
                  {menuPermissions.map((menu, menuIndex) => (
                    <div key={`${menu.category}-${menuIndex}`} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium">{menu.category}</h4>
                        <Badge variant="outline" className="ml-2">
                          {menu.permissions.length} permissions
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {menu.permissions.map((permissionItem, permIndex) => (
                          'name' in permissionItem ? (
                            <FormField
                              key={`${menu.category}-${permissionItem.name}-${permIndex}`}
                              control={form.control}
                              name="permissionIds"
                              render={({ field }) => {
                                const permission = permissions.find(p => p.name === permissionItem.name);
                                return permission ? (
                                  <FormItem
                                    key={permission.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(permission.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, permission.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== permission.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>
                                        {permissionItem.name}
                                      </FormLabel>
                                      <FormDescription>
                                        {permissionItem.description}
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                ) : (
                                  <div></div>
                                );
                              }}
                            />
                          ) : (
                            <div key={`subcategory-${permissionItem.subcategory}`} className="ml-4 space-y-4">
                              <div className="flex items-center gap-2">
                                <h5 className="text-base font-medium">{permissionItem.subcategory}</h5>
                                <Badge variant="outline" className="ml-2">
                                  {permissionItem.permissions.length} permissions
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {permissionItem.permissions.map((subPermission, subPermIndex) => {
                                  const permission = permissions.find(p => p.name === subPermission.name);
                                  return permission ? (
                                    <FormField
                                      key={`${menu.category}-${permissionItem.subcategory}-${subPermission.name}-${subPermIndex}`}
                                      control={form.control}
                                      name="permissionIds"
                                      render={({ field }) => (
                                        <FormItem
                                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(permission.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, permission.id])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== permission.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                            <FormLabel>
                                              {subPermission.name}
                                            </FormLabel>
                                            <FormDescription>
                                              {subPermission.description}
                                            </FormDescription>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                  ) : (
                                    <div key={`empty-${subPermIndex}`}></div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : role ? (
                  "Update Role"
                ) : (
                  "Create Role"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 