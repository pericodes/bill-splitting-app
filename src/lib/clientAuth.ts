"use client";

import { neonClient } from "@/data/neonClient";

function errorMessage(result: unknown, fallback: string): string {
  if (!result || typeof result !== "object") return fallback;
  const err = (result as { error?: { message?: string } | string | null }).error;
  if (!err) return "";
  if (typeof err === "string") return err;
  return err.message || fallback;
}

function isJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every(Boolean);
}

function tokenFrom(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const root = result as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const session = data.session && typeof data.session === "object" ? (data.session as Record<string, unknown>) : null;
  const token = data.token ?? session?.token ?? root.token;
  return typeof token === "string" && token ? token : null;
}

async function jwtFromPlugin(): Promise<string | null> {
  const auth = neonClient.auth as typeof neonClient.auth & {
    token?: () => Promise<unknown>;
  };
  if (typeof auth.token !== "function") return null;
  const result = await auth.token();
  const token = tokenFrom(result);
  return token && isJwt(token) ? token : null;
}

async function sessionJwt(): Promise<string> {
  const sessionRes = await neonClient.auth.getSession();
  const fromSession = tokenFrom(sessionRes);
  if (fromSession && isJwt(fromSession)) return fromSession;

  const fromPlugin = await jwtFromPlugin();
  if (fromPlugin) return fromPlugin;

  if (fromSession) return fromSession;
  throw new Error("No se pudo obtener la sesión");
}

export async function neonSignIn(email: string, password: string): Promise<string> {
  const result = await neonClient.auth.signIn.email({ email, password });
  const message = errorMessage(result, "No se pudo iniciar sesión");
  if (message) throw new Error(message);
  return sessionJwt();
}

export async function neonSignUp(email: string, password: string, name: string): Promise<string> {
  const result = await neonClient.auth.signUp.email({ email, password, name });
  const message = errorMessage(result, "No se pudo crear la cuenta");
  if (message) throw new Error(message);
  try {
    return await sessionJwt();
  } catch {
    return neonSignIn(email, password);
  }
}

export async function neonSignOut(): Promise<void> {
  try {
    await neonClient.auth.signOut();
  } catch {
    // La sesión local de la app se limpia igual.
  }
}
