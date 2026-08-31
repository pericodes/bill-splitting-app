import type { Metadata } from "next";
import WelcomePage from "./WelcomePage";
import { safeJoinNext } from "@/lib/joinNext";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entra como invitado o con tu cuenta para gestionar gastos compartidos.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  return <WelcomePage nextPath={safeJoinNext(params.next)} />;
}
