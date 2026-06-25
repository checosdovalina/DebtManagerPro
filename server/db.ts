import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// Use SSL for remote databases (e.g. Neon, managed Postgres) but not for a
// local PostgreSQL on the same host (localhost / 127.0.0.1 / unix socket),
// which typically has SSL disabled.
const isLocal =
  /@(localhost|127\.0\.0\.1|::1)[:/]/.test(connectionString) ||
  connectionString.includes("host=/") ||
  connectionString.includes("host=localhost");

export const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
