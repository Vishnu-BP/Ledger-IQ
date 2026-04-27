/**
 * @file drizzle.config.ts — drizzle-kit CLI config.
 * @module config
 *
 * Drives `pnpm db:generate` (diff schema.ts → SQL migration) and
 * `pnpm db:migrate` (apply migrations to DATABASE_URL). Migration application
 * during this build is normally routed through the Supabase MCP, but having
 * this config means the CLI fallback works too.
 *
 * @dependencies drizzle-kit, dotenv
 * @related db/schema.ts, db/migrations/
 */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
