import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts Payable | Finance",
  description: "Manage and track vendor bills and payments",
};

export default function AccountsPayableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 