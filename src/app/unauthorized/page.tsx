import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <AlertTriangle className="mx-auto h-24 w-24 text-yellow-500" />
        <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-xl text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="pt-6">
          <Link href="/dashboard">
            <Button size="lg">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 