const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

if (process.env.NODE_ENV === "production") {
  console.error("Prisma y DEV_DATABASE_URL solo están permitidos en desarrollo.");
  process.exit(1);
}

if (!process.env.DEV_DATABASE_URL) {
  console.error("Falta DEV_DATABASE_URL. Defínela en .env (solo desarrollo).");
  process.exit(1);
}
