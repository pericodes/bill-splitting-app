import { createRemoteJWKSet, jwtVerify } from "jose";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;

export type NeonAuthUser = {
  authUserId: string;
  name?: string;
  email?: string;
};

function isJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every(Boolean);
}

function pickUser(body: unknown): { id?: string; name?: string; email?: string } | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  const nestedData = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const user =
    (root.user as Record<string, unknown> | undefined) ||
    (nestedData?.user as Record<string, unknown> | undefined) ||
    (nestedData as Record<string, unknown> | null);
  if (!user || typeof user !== "object") return null;
  const id = typeof user.id === "string" ? user.id : undefined;
  const name = typeof user.name === "string" ? user.name : undefined;
  const email = typeof user.email === "string" ? user.email : undefined;
  return { id, name, email };
}

function userFromClaims(payload: Record<string, unknown>): NeonAuthUser | null {
  const id =
    (typeof payload.id === "string" && payload.id) ||
    (typeof payload.sub === "string" && payload.sub) ||
    undefined;
  if (!id) return null;
  return {
    authUserId: id,
    name: typeof payload.name === "string" ? payload.name : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!authUrl) {
    throw new Error("Falta NEXT_PUBLIC_NEON_AUTH_URL");
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${authUrl.replace(/\/$/, "")}/.well-known/jwks.json`));
  }
  return jwks;
}

async function verifyJwt(token: string): Promise<NeonAuthUser> {
  if (!authUrl) {
    throw new Error("Falta NEXT_PUBLIC_NEON_AUTH_URL");
  }
  const issuer = new URL(authUrl).origin;
  const keys = getJwks();
  let payload: Record<string, unknown>;
  try {
    ({ payload } = await jwtVerify(token, keys, {
      issuer,
      audience: issuer,
      clockTolerance: 5,
    }));
  } catch {
    ({ payload } = await jwtVerify(token, keys, { clockTolerance: 5 }));
    const iss = typeof payload.iss === "string" ? payload.iss : "";
    if (iss && iss !== issuer && !iss.startsWith(`${issuer}/`)) {
      throw new Error("Sesión de autenticación inválida");
    }
  }
  const user = userFromClaims(payload);
  if (!user) {
    throw new Error("Sesión de autenticación inválida");
  }
  return user;
}

async function fetchSession(headers: HeadersInit): Promise<Response> {
  if (!authUrl) {
    throw new Error("Falta NEXT_PUBLIC_NEON_AUTH_URL");
  }
  return fetch(`${authUrl.replace(/\/$/, "")}/get-session`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
}

async function verifyViaGetSession(token: string): Promise<NeonAuthUser> {
  const encoded = encodeURIComponent(token);
  const attempts: HeadersInit[] = [
    { Authorization: `Bearer ${token}` },
    { Cookie: `better-auth.session_token=${encoded}` },
    { Cookie: `__Secure-better-auth.session_token=${encoded}` },
  ];

  let lastStatus = 0;
  for (const headers of attempts) {
    const res = await fetchSession(headers);
    lastStatus = res.status;
    if (!res.ok) continue;
    const body = await res.json().catch(() => null);
    const user = pickUser(body);
    if (user?.id) {
      return { authUserId: user.id, name: user.name, email: user.email };
    }
  }

  throw new Error(
    lastStatus === 401 || lastStatus === 403
      ? "Sesión de autenticación inválida"
      : "No se pudo verificar la sesión"
  );
}

export async function verifyNeonSession(token: string): Promise<NeonAuthUser> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("Sesión de autenticación inválida");
  }

  if (isJwt(trimmed)) {
    try {
      return await verifyJwt(trimmed);
    } catch (err) {
      if (err instanceof Error && err.message === "Sesión de autenticación inválida") {
        throw err;
      }
      const name = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
      if (name.startsWith("ERR_JWT") || name.startsWith("ERR_JWS") || name.startsWith("ERR_JOSE")) {
        throw new Error("Sesión de autenticación inválida");
      }
      throw new Error("No se pudo verificar la sesión");
    }
  }

  return verifyViaGetSession(trimmed);
}
