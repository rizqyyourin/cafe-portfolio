import { describe, expect, it } from "vitest";

import { auth } from "@/lib/auth";

describe("internal auth configuration", () => {
  it("disables public sign-up for invite-only access", () => {
    expect(auth.options.emailAndPassword).toMatchObject({ enabled: true, disableSignUp: true });
  });
});
