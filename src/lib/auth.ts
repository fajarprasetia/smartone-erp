import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

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