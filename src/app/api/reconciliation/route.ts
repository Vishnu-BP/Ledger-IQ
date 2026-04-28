/**
 * @file route.ts — GET /api/reconciliation — list settlements + reconciliations.
 * @module app/api/reconciliation
 *
 * Returns a joined view of settlements with their reconciliation records,
 * used by the reconciliation page to show the full picture. Business-scoped.
 *
 * @dependencies @/lib/auth, @/db/client, drizzle-orm
 */

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getCurrentBusiness } from "@/lib/auth";
import { db } from "@/db/client";
import { reconciliations, settlements } from "@/db/schema";

export async function GET() {
  const result = await getCurrentBusiness();
  if (!result) {
    return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });
  }
  if (!result.business) {
    return NextResponse.json({ error: { code: "no_business" } }, { status: 403 });
  }

  const businessId = result.business.id;

  const [allSettlements, allReconciliations] = await Promise.all([
    db
      .select()
      .from(settlements)
      .where(eq(settlements.business_id, businessId))
      .orderBy(desc(settlements.uploaded_at)),
    db
      .select()
      .from(reconciliations)
      .where(eq(reconciliations.business_id, businessId))
      .orderBy(desc(reconciliations.detected_at)),
  ]);

  return NextResponse.json({ settlements: allSettlements, reconciliations: allReconciliations });
}
