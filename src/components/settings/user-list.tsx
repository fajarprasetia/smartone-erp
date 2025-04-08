"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserListProps {
  users: (User & {
    role: Role;
  })[];
  roles: Role[];
}

export function UserList({ users, roles }: UserListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/settings/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No users found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{user.name || "Unnamed User"}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
                {user.role.name !== "System Administrator" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          user account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Role:</span>{" "}
                <Badge variant="outline">{user.role.name}</Badge>
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                <Badge
                  variant={user.isActive ? "default" : "secondary"}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 