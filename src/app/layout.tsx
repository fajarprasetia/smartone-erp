import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartOne ERP",
  description: "A modern ERP system for managing your business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          {/* Portal container for popovers */}
          <div id="popover-portal" className="fixed inset-0 z-[999]">
            <div className="pointer-events-none absolute inset-0" />
          </div>
          {/* Portal container for custom popovers */}
          <div id="custom-popover-portal" className="fixed inset-0 z-[1000]" />
          {/* Portal container for modals */}
          <div id="modal-root" className="fixed inset-0 z-[9999]" />
        </Providers>
      </body>
    </html>
  );
}