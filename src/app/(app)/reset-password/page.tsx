import type { Metadata } from "next";
import ResetPasswordPage from "./ResetPasswordPage";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Restablece la contraseña de tu cuenta.",
  robots: { index: false, follow: false },
};

function first(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function ResetPasswordRoute({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[]; email?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = first(params.token);
  const error = first(params.error);
  const email = first(params.email);
  return (
    <ResetPasswordPage
      token={token || null}
      invalidToken={error === "INVALID_TOKEN"}
      email={email.includes("@") ? email : ""}
    />
  );
}
