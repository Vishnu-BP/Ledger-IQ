/**
 * @file route.ts — GET /api/transactions — list transactions with filters.
 * @module app/api/transactions
 *
 * Reads filter values from URL search params, validates via Zod, calls the
 * listTransactions service. Always business-scoped via auth.getUser →
 * getCurrentBusiness chain. Response shape matches PRD §12.4.
 *
 * @dependencies next/server, zod, @/lib/auth, @/lib/transactions
 * @related lib/hooks/useTransactions.ts
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { listTransactions } from "@/lib/transactions";

const log = createLogger("API");

const filtersSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  channel: z.string().max(40).optional(),
  needs_review: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const result = await getCurrentBusiness();
  if (!result) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Authentication required" } },
      { status: 401 },
    );
  }
  if (!result.business) {
    return NextResponse.json(
      {
        error: {
          code: "no_business",
          message: "Complete onboarding first",
        },
      },
      { status: 403 },
    );
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = filtersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_filters",
          message: "Invalid query parameters",
          issues: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  try {
    const { rows, totalCount } = await listTransactions({
      businessId: result.business.id,
      startDate: parsed.data.start_date,
      endDate: parsed.data.end_date,
      search: parsed.data.search,
      category: parsed.data.category,
      channel: parsed.data.channel,
      needsReview: parsed.data.needs_review,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
    return NextResponse.json({
      transactions: rows,
      total_count: totalCount,
      filters_applied: parsed.data,
    });
  } catch (err) {
    log.error("listTransactions failed", { error: String(err) });
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not load transactions" } },
      { status: 500 },
    );
  }
}
