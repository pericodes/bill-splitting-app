import { createClient } from '@neondatabase/neon-js';

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL || process.env.VITE_NEON_DATA_API_URL;

if (!authUrl || !dataApiUrl) {
  throw new Error(
    'Faltan NEXT_PUBLIC_NEON_AUTH_URL o NEXT_PUBLIC_NEON_DATA_API_URL. Esta app usa Data API, no una conexión directa a la BD.'
  );
}

// Cliente de servidor (adapter vanilla). No usa DATABASE_URL ni neon().
export const dataApi = createClient({
  auth: {
    url: authUrl,
    allowAnonymous: true,
  },
  dataApi: {
    url: dataApiUrl,
  },
});

export function throwIfApiError(error: { message?: string } | null, fallback = 'Error de Data API') {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
