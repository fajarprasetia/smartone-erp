import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Package, Users, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application settings, users, roles, and permissions.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/dashboard">
              <Card className="h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <LayoutDashboard className="h-8 w-8 mb-2" />
                  <CardTitle>Dashboard Settings</CardTitle>
                  <CardDescription>
                    Configure which dashboard cards are visible to specific roles.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/products">
              <Card className="h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <Package className="h-8 w-8 mb-2" />
                  <CardTitle>Product Management</CardTitle>
                  <CardDescription>
                    Add, edit, or remove products from your inventory.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/users">
              <Card className="h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <Users className="h-8 w-8 mb-2" />
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Add, edit, or remove users and assign roles.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/roles">
              <Card className="h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <Shield className="h-8 w-8 mb-2" />
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Create, edit, or remove roles and assign permissions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 