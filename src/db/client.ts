/**
 * @file client.ts — Server-side Drizzle ORM client (postgres-js driver).
 * @module db
 *
 * Single shared Drizzle instance for runtime queries. The `postgres` driver
 * pools connections automatically; we cap at a low pool size because Supabase
 * transaction pooler enforces its own limits and we want predictable behavior
 * from each route handler invocation.
 *
 * IMPORTANT: server-only. Do NOT import in 'use client' components — connection
 * string and queries must never reach the browser.
 *
 * @dependencies drizzle-orm/postgres-js, postgres
 * @related db/schema.ts, lib/env.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/db/schema";

// One shared connection per Node process. Supabase transaction pooler handles
// the actual pooling; this client just opens a cheap multiplexed handle.
const client = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false, // pgbouncer transaction mode is incompatible with prepared statements
});

export const db = drizzle(client, { schema });
export { schema };
