import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/db/schema";

/**
 * Singleton pattern for the database client to prevent hitting connection limits
 * during development hot-reloads.
 */
const globalForDb = global as unknown as {
  postgresClient: postgres.Sql | undefined;
};

const postgresClient =
  globalForDb.postgresClient ??
  postgres(env.DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false, // pgbouncer transaction mode incompatibility
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = postgresClient;
}

export const db = drizzle(postgresClient, { schema });
export { schema };
