"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  roles: string[];
}

const settingsNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/settings/dashboard",
    roles: ["System Administrator", "Administrator"],
  },
  {
    title: "Products",
    href: "/settings/products",
    roles: ["System Administrator", "Administrator"],
  },
  {
    title: "Users",
    href: "/settings/users",
    roles: ["System Administrator"],
  },
  {
    title: "Roles",
    href: "/settings/roles",
    roles: ["System Administrator"],
  },
];

interface SettingsNavProps {
  userRole: string | null;
}

export function SettingsNav({ userRole }: SettingsNavProps) {
  const pathname = usePathname();

  // Filter nav items based on user role
  const filteredNavItems = settingsNavItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <nav className="grid items-start gap-2">
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === item.href
              ? "bg-accent text-accent-foreground"
              : "transparent"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 