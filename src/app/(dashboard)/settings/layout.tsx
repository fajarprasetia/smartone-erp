import { requireRole } from "@/lib/auth";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure only System Administrator and Administrator can access settings
  await requireRole(["System Administrator", "Administrator"]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      {children}
    </div>
  );
} 