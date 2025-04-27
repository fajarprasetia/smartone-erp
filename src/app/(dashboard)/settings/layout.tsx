import { getCurrentUser, hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  // Allow System Administrator and Administrator roles to access settings
  const isSystemAdmin = hasRole(user, "System Administrator");
  const isAdmin = hasRole(user, "Administrator");
  
  if (!isSystemAdmin && !isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      {children}
    </div>
  );
} 