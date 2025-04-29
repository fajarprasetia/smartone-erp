import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessMenuItem } from "@/lib/permissions";

// Define public paths that don't require authentication
const publicPaths = ["/auth/login", "/auth/error", "/api/auth"];

// Define paths that should always be accessible after login (even without specific permissions)
const alwaysAccessiblePaths = ["/dashboard", "/api/dashboard/stats"];

// Define API paths and their corresponding permission paths
const apiPathMappings = [
  // Dashboard APIs
  { path: "/api/dashboard", permissionPath: "/dashboard" },
  { path: "/api/overview", permissionPath: "/dashboard" },
  { path: "/api/sales", permissionPath: "/dashboard" },
  
  // Manager APIs
  { path: "/api/manager", permissionPath: "/manager" },
  { path: "/api/manager/approval", permissionPath: "/manager" },
  
  // Marketing APIs
  { path: "/api/marketing/customer", permissionPath: "/marketing/customer" },
  { path: "/api/marketing/whatsapp", permissionPath: "/marketing/whatsapp" },
  { path: "/api/marketing/whatsapp/chat", permissionPath: "/marketing/whatsapp/chat" },
  
  // Inventory APIs
  { path: "/api/inventory", permissionPath: "/inventory" },
  { path: "/api/inventory/inbound", permissionPath: "/inventory/inbound" },
  { path: "/api/inventory/outbound", permissionPath: "/inventory/outbound" },
  { path: "/api/inventory/consumables", permissionPath: "/inventory/consumables" },
  { path: "/api/inventory/assets", permissionPath: "/inventory/assets" },
  { path: "/api/paper", permissionPath: "/inventory" },
  { path: "/api/inventory/paper-request", permissionPath: "/inventory" },
  { path: "/api/inventory/paper-request/sublimation", permissionPath: "/inventory" },
  
  // Order APIs
  { path: "/api/order", permissionPath: "/order" },
  
  // Design APIs
  { path: "/api/design", permissionPath: "/design" },
  
  // Production APIs
  { path: "/api/production", permissionPath: "/production" },
  { path: "/api/production/list", permissionPath: "/production/list" },
  { path: "/api/production/print", permissionPath: "/production/print" },
  { path: "/api/production/press", permissionPath: "/production/press" },
  { path: "/api/production/cutting", permissionPath: "/production/cutting" },
  { path: "/api/production/dtf", permissionPath: "/production/dtf" },
  
  // Finance APIs
  { path: "/api/finance", permissionPath: "/finance" },
  
  // Settings APIs
  { path: "/api/settings", permissionPath: "/settings" },
  { path: "/api/settings/users", permissionPath: "/settings/users" },
  { path: "/api/settings/roles", permissionPath: "/settings/roles" },
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if path is in public paths
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({ req: request });

  // If no token and not on a public path, redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Always allow access to specified paths after login
  if (alwaysAccessiblePaths.some(p => path === p)) {
    return NextResponse.next();
  }

  // Check if path is an API route
  const isApiRoute = path.startsWith("/api/");

  if (isApiRoute) {
    // Find the matching API mapping by getting the most specific match
    let bestMatch = null;
    let bestMatchLength = 0;
    
    for (const mapping of apiPathMappings) {
      if (path.startsWith(mapping.path) && mapping.path.length > bestMatchLength) {
        bestMatch = mapping;
        bestMatchLength = mapping.path.length;
      }
    }
    
    // Use the best match found or null
    const apiMapping = bestMatch;

    if (apiMapping) {
      // Check if user has permission for the corresponding page path
      const hasPermission = canAccessMenuItem(token.role?.permissions, apiMapping.permissionPath);
      
      if (hasPermission) {
        return NextResponse.next();
      }
      
      // Return proper JSON forbidden response instead of redirect for API routes
      return NextResponse.json(
        { error: "Forbidden", message: "You don't have permission to access this resource" },
        { status: 403 }
      );
    }
    
    // Log unmatched API paths in development to help identify missing mappings
    console.log(`API path not configured for access control: ${path}`);
    
    // If API path not explicitly defined, default to forbidding access
    return NextResponse.json(
      { error: "Forbidden", message: "API route not configured for access control" },
      { status: 403 }
    );
  }

  // For regular page routes, check permission and redirect if not allowed
  const hasPermission = canAccessMenuItem(token.role?.permissions, path);
  if (!hasPermission) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};