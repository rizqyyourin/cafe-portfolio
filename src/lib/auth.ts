import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db/client";
import * as schema from "@/db/schema";

const configuredSecret = process.env.BETTER_AUTH_SECRET;

/**
 * This placeholder only lets static compilation inspect protected route modules.
 * Actual production auth traffic is blocked by assertAuthIsConfigured below.
 */
const buildOnlySecret = "build-only-secret-not-valid-for-production-0123456789";

/** Public sign-up is disabled; accounts are provisioned by migration or admin tooling. */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  secret: configuredSecret ?? buildOnlySecret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export function assertAuthIsConfigured() {
  if (process.env.NODE_ENV === "production" && !configuredSecret) {
    throw new Error("BETTER_AUTH_SECRET must be set before enabling production admin authentication.");
  }
}
