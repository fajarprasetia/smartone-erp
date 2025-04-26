import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};

// Define custom types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: {
        id: string;
        name: string;
        isAdmin: boolean;
      };
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: {
      id: string;
      name: string;
      isAdmin: boolean;
    };
  }
}

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  
  if (!user.role || !roles.includes(user.role.name)) {
    redirect("/dashboard");
  }
  
  return user;
}

export function hasPermission(user: any, permissionName: string) {
  if (!user?.role?.permissions) {
    return false;
  }
  
  return user.role.permissions.some(
    (permission: any) => permission.name === permissionName
  );
}

export function hasRole(user: any, roleName: string) {
  if (!user?.role) {
    return false;
  }
  
  return user.role.name === roleName;
}

// Helper function to check if a user can access a specific menu item
export function canAccessMenuItem(user: any, menuPath: string) {
  // System Administrator and Administrator can access everything
  if (hasRole(user, "System Administrator") || hasRole(user, "Administrator")) {
    return true;
  }
  
  // Check if the user has permission for the specific menu
  const permissionMap: Record<string, string> = {
    "/dashboard": "view_dashboard",
    "/manager": "view_manager",
    "/marketing": "view_marketing",
    "/inventory": "view_inventory",
    "/order": "view_order",
    "/design": "view_design",
    "/production": "view_production",
    "/finance": "view_finance",
    "/settings": "view_settings",
  };
  
  const permission = permissionMap[menuPath];
  
  if (!permission) {
    return true; // If no specific permission is defined, allow access
  }
  
  return hasPermission(user, permission);
} 