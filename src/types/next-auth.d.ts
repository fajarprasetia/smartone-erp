import { Role, Permission } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: {
      id: string;
      name: string;
      isAdmin: boolean;
      isSystem: boolean;
      permissions: {
        id: string;
        name: string;
      }[];
    };
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: {
      id: string;
      name: string;
      isAdmin: boolean;
      isSystem: boolean;
      permissions: {
        id: string;
        name: string;
      }[];
    };
  }
} 