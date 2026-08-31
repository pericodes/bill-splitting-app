"use client";

import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL || process.env.VITE_NEON_DATA_API_URL;

if (!authUrl || !dataApiUrl) {
  console.warn('Neon Auth URL or Data API URL is missing. Client-side database features will not work.');
}

// Creamos un cliente único que incluye autenticación con React Hooks (BetterAuthReactAdapter)
// y acceso a la Data API compatible con PostgREST.
export const neonClient = createClient({
  auth: {
    adapter: BetterAuthReactAdapter(),
    url: authUrl || '',
    allowAnonymous: true,
  },
  dataApi: {
    url: dataApiUrl || '',
  },
});
