import { createClient } from '@neondatabase/neon-js';

const authUrlEnv = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
const dataApiUrlEnv = process.env.NEXT_PUBLIC_NEON_DATA_API_URL || process.env.VITE_NEON_DATA_API_URL;

if (!authUrlEnv || !dataApiUrlEnv) {
  throw new Error(
    'Faltan NEXT_PUBLIC_NEON_AUTH_URL o NEXT_PUBLIC_NEON_DATA_API_URL. Esta app usa Data API, no una conexión directa a la BD.'
  );
}

const authUrl: string = authUrlEnv;
const dataApiUrl: string = dataApiUrlEnv;

function tokenExpiresAtMs(token: string): number {
  try {
    const part = token.split('.')[1];
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return Number(payload.exp) * 1000;
  } catch {
    return Date.now() + 5 * 60 * 1000;
  }
}

let cached: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchAnonymousToken(): Promise<string | null> {
  const url = `${authUrl.replace(/\/$/, '')}/token/anonymous`;
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as { message?: string }));
    throw new Error(body.message || `AuthApiError: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  return typeof body?.token === 'string' ? body.token : null;
}

async function getAnonymousJwt(): Promise<string | null> {
  if (cached && Date.now() < cached.expiresAt - 30_000) {
    return cached.token;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const token = await fetchAnonymousToken();
    if (token) {
      cached = { token, expiresAt: tokenExpiresAtMs(token) };
    }
    return token;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

// Token anónimo cacheado: el cliente de Neon Auth llama a /get-session en cada
// query y, sin cookie en el servidor, no cachea el "no hay sesión" → 429.
export const dataApi = createClient({
  dataApi: {
    url: dataApiUrl,
    getToken: getAnonymousJwt,
  },
});

export function throwIfApiError(error: { message?: string } | null, fallback = 'Error de Data API') {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
