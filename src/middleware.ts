import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth, withAuth } from "next-auth/middleware";

// Define the paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/manager",
  "/marketing",
  "/inventory",
  "/order",
  "/design",
  "/production",
  "/finance",
  "/settings",
];

// Define the paths that require specific roles
const roleProtectedPaths = {
  "/settings": ["System Administrator", "Administrator"],
};

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const token = await getToken({ req });
    const path = req.nextUrl.pathname;

    // Check if the path requires authentication
    const isProtectedPath = protectedPaths.some((protectedPath) =>
      path.startsWith(protectedPath)
    );

    if (isProtectedPath) {
      // If the user is not authenticated, redirect to the sign-in page
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }

      // Check if the path requires specific roles
      for (const [protectedPath, roles] of Object.entries(roleProtectedPaths)) {
        if (path.startsWith(protectedPath)) {
          const userRole = token.role?.name;

          // If the user's role is not in the allowed roles, redirect to the dashboard
          if (!userRole || !roles.includes(userRole)) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/manager/:path*",
    "/marketing/:path*",
    "/inventory/:path*",
    "/order/:path*",
    "/design/:path*",
    "/production/:path*",
    "/finance/:path*",
    "/settings/:path*",
  ],
}; 