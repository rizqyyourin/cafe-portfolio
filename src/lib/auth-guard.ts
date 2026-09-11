import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { assertAuthIsConfigured, auth } from "@/lib/auth";

export async function requireAdminSession() {
  assertAuthIsConfigured();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  return session;
}
