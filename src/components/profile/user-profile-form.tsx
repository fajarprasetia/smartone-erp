"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface UserProfileFormProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    role?: {
      id?: string
      name?: string
      isAdmin?: boolean
      permissions?: any[]
    } | null
  }
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  // Get the role name safely
  const roleName = user?.role?.name || null;
  
  // Get permissions if they exist
  const permissions = user?.role?.permissions || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-white">Name</Label>
          <div className="p-2 rounded-md bg-white/10 border border-white/30 text-white">
            {user?.name || "Not set"}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-white">Email</Label>
          <div className="p-2 rounded-md bg-white/10 border border-white/30 text-white">
            {user?.email || "Not set"}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-white">Role</Label>
          <div className="p-2 rounded-md bg-white/10 border border-white/30 text-white flex items-center">
            {roleName ? (
              <Badge 
                className={`${
                  roleName === "System Administrator"
                    ? "bg-red-500/20 text-red-200 hover:bg-red-500/30 hover:text-red-100"
                    : roleName === "Administrator"
                    ? "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 hover:text-purple-100"
                    : "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 hover:text-blue-100"
                }`}
              >
                {roleName}
              </Badge>
            ) : (
              "Not assigned"
            )}
          </div>
        </div>

        {/* Only show permissions if the user has any */}
        {permissions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Permissions</Label>
            <div className="p-2 rounded-md bg-white/10 border border-white/30 text-white">
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission: any) => (
                  <Badge 
                    key={permission.id} 
                    variant="outline" 
                    className="bg-white/5 text-white/80 border-white/20"
                  >
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 