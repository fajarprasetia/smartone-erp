import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/settings/user-table";
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { Role, User } from "@prisma/client";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  // Fetch data on the server
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return <UsersClient users={users} roles={roles} />;
} 