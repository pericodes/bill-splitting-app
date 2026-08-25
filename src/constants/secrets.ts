export const SECRETS = {
  // Aquí se almacenarán los secretos como se solicitó.
  // IMPORTANTE: En producción real, estos valores deben venir de process.env
  // y nunca ser commiteados directamente si son sensibles.
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "default_local_secret_123",
};
