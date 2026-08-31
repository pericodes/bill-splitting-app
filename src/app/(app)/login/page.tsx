import type { Metadata } from "next";
import WelcomePage from "./WelcomePage";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entra como invitado o con tu cuenta para gestionar gastos compartidos.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <WelcomePage />;
}
