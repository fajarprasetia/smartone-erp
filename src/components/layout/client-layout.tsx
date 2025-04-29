"use client"

import { PortalContainers } from "./portal-containers";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PortalContainers />
    </>
  );
} 