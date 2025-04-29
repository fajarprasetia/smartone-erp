"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Authentication Error</h1>
          <p className="text-sm text-muted-foreground">
            {error || "An error occurred during authentication"}
          </p>
        </div>

        <div className="flex justify-center">
          <Button asChild>
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 