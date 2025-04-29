import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = session.user.role?.name;

  // Check if user has access to settings
  if (!userRole || !["System Administrator", "Administrator"].includes(userRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full flex-col space-y-8 p-8 overflow-hidden">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>
      <main className="flex w-full flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 