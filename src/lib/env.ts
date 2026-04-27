/**
 * @file env.ts — Server-only environment variable validation via Zod.
 * @module lib
 *
 * Validates required env vars at module load and throws a descriptive error if
 * any are missing/malformed so the server fails fast instead of crashing at
 * first use.
 *
 * IMPORTANT: This module reads server-only secrets (SUPABASE_SERVICE_ROLE_KEY,
 * OPENROUTER_API_KEY, DATABASE_URL). It MUST NOT be imported in any 'use client'
 * file. Client code should read process.env.NEXT_PUBLIC_* directly — those are
 * inlined by Next.js at build time.
 *
 * @dependencies zod
 * @related .env.local, .env.example
 */

import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Database (Postgres connection string for Drizzle migrations + runtime)
  DATABASE_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `[ENV] Invalid environment variables — fix .env.local before continuing:\n${issues}`,
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
