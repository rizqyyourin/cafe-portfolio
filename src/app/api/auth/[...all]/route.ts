import { toNextJsHandler } from "better-auth/next-js";

import { assertAuthIsConfigured, auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  assertAuthIsConfigured();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  assertAuthIsConfigured();
  return handlers.POST(request);
}
