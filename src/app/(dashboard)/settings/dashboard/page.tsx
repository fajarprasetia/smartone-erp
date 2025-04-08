import { prisma } from "@/lib/prisma";
import { DashboardCardForm } from "@/components/settings/dashboard-card-form";
import { DashboardCardList } from "@/components/settings/dashboard-card-list";

export default async function DashboardSettingsPage() {
  const dashboardCards = await prisma.dashboardCard.findMany({
    include: {
      roles: true,
    },
  });

  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Settings</h2>
        <p className="text-muted-foreground">
          Configure which dashboard cards are visible to specific roles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-4">Add New Dashboard Card</h3>
          <DashboardCardForm roles={roles} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Existing Dashboard Cards</h3>
          <DashboardCardList dashboardCards={dashboardCards} roles={roles} />
        </div>
      </div>
    </div>
  );
} 