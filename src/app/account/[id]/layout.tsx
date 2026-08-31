import type { ReactNode } from "react";
import { AccountDataProvider } from "./AccountDataProvider";

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountDataProvider accountId={id}>{children}</AccountDataProvider>;
}
