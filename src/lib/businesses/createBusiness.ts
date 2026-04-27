/**
 * @file createBusiness.ts — Service to create a business row for the current user.
 * @module lib/businesses
 *
 * Enforces one-business-per-user (hackathon scope). Re-running this for a
 * user who already has a business throws a 409-equivalent error so the route
 * handler can return the right status code.
 *
 * Auth check happens here, not just in the route handler — defense-in-depth
 * per CLAUDE.md three-layer auth.
 *
 * @dependencies @/db/client, @/db/schema, @/lib/supabase/server, drizzle-orm
 * @related app/api/onboarding/route.ts, lib/onboarding/schema.ts
 */

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import { createLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingValues } from "@/lib/onboarding/schema";

const log = createLogger("AUTH");

export class BusinessAlreadyExistsError extends Error {
  constructor() {
    super("A business already exists for this user");
    this.name = "BusinessAlreadyExistsError";
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthenticatedError";
  }
}

export async function createBusiness(input: OnboardingValues) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new UnauthenticatedError();

  const [existing] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.user_id, user.id))
    .limit(1);

  if (existing) throw new BusinessAlreadyExistsError();

  const [created] = await db
    .insert(businesses)
    .values({
      user_id: user.id,
      name: input.name,
      business_type: input.business_type,
      industry_subcategory: input.industry_subcategory || null,
      gstin: input.gstin ? input.gstin : null,
      state: input.state,
      fiscal_year_start_month: input.fiscal_year_start_month,
      sales_channels: input.sales_channels,
      primary_bank: input.primary_bank,
    })
    .returning({ id: businesses.id });

  log.info("Business created", { businessId: created.id, userId: user.id });
  return created;
}
