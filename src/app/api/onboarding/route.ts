/**
 * @file route.ts — POST /api/onboarding — create the user's business.
 * @module app/api/onboarding
 *
 * Validates the wizard payload via Zod, then delegates to the createBusiness
 * service. Maps service errors to HTTP status codes per CLAUDE.md's
 * centralized error response shape: `{ error: { code, message } }`.
 *
 * @dependencies @/lib/businesses/createBusiness, @/lib/onboarding/schema, zod
 * @related components/onboarding/OnboardingWizard.tsx
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  BusinessAlreadyExistsError,
  UnauthenticatedError,
  createBusiness,
} from "@/lib/businesses/createBusiness";
import { createLogger } from "@/lib/logger";
import { onboardingSchema } from "@/lib/onboarding/schema";

const log = createLogger("API");

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body must be JSON" } },
      { status: 400 },
    );
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Invalid form data",
          issues: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  try {
    const business = await createBusiness(parsed.data);
    return NextResponse.json({ business });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: { code: "unauthenticated", message: err.message } },
        { status: 401 },
      );
    }
    if (err instanceof BusinessAlreadyExistsError) {
      return NextResponse.json(
        { error: { code: "conflict", message: err.message } },
        { status: 409 },
      );
    }
    log.error("Unexpected onboarding error", { error: String(err) });
    return NextResponse.json(
      {
        error: { code: "server_error", message: "Something went wrong" },
      },
      { status: 500 },
    );
  }
}
