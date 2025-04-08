"use client";

import { useState } from "react";
import { UserTable } from "@/components/settings/user-table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { Role, User } from "@prisma/client";

interface UsersClientProps {
  users: (User & { role: Role })[];
  roles: Role[];
}

export function UsersClient({ users, roles }: UsersClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users and assign roles to control access to the system.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div>
        <UserTable users={users} roles={roles} />
      </div>
      
      <UserFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        roles={roles}
      />
    </div>
  );
} 