import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
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
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
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
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
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
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
      }

      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user?.id;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
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
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.user?.email) return null;

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }
  return user;
}

export async function requireRole(requiredPermissions: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const userPermissions = user.role.permissions.map((p) => p.name);
  const hasPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );

  if (!hasPermission) {
    redirect("/unauthorized");
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