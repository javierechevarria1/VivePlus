import { Pool } from "pg";

const requiredEnv = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());

if (process.env.LOCAL_DEMO !== "true" && missingEnv.length > 0) {
  throw new Error(
    `Faltan variables de entorno de PostgreSQL: ${missingEnv.join(", ")}. ` +
      "En Vercel configúralas en Project Settings > Environment Variables. " +
      "No uses localhost en producción salvo que la BD esté realmente en ese servidor."
  );
}

const ssl =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
    : false;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl,
});

export { pool };