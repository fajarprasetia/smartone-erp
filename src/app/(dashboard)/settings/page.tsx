import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application settings, users, roles, and permissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to Settings</CardTitle>
          <CardDescription>
            Use the sidebar navigation to access different settings sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a setting category from the sidebar menu to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 