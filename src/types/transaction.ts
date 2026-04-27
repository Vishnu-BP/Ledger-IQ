/**
 * @file transaction.ts — Domain types for transaction rows.
 * @module types
 *
 * Inferred from Drizzle schema so runtime + types stay in lockstep without
 * hand-maintained duplication.
 *
 * @related db/schema.ts, lib/parsers/types.ts
 */

import type { transactions } from "@/db/schema";

export type Transaction = typeof transactions.$inferSelect;
export type TransactionInsert = typeof transactions.$inferInsert;
