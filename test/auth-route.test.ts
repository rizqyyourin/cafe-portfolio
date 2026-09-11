import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertAuthIsConfigured: vi.fn(),
  get: vi.fn(async () => new Response("get")),
  post: vi.fn(async () => new Response("post", { status: 201 })),
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: vi.fn(() => ({ GET: mocks.get, POST: mocks.post })),
}));
vi.mock("@/lib/auth", () => ({
  assertAuthIsConfigured: mocks.assertAuthIsConfigured,
  auth: {},
}));

import { POST } from "@/app/api/auth/[...all]/route";

describe("auth POST route", () => {
  beforeEach(() => {
    mocks.assertAuthIsConfigured.mockReset();
    mocks.post.mockClear();
  });

  it("guards configuration and forwards POST requests to Better Auth", async () => {
    const request = new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: "owner@example.com", password: "secret" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(mocks.assertAuthIsConfigured).toHaveBeenCalledOnce();
    expect(mocks.post).toHaveBeenCalledWith(request);
    expect(response.status).toBe(201);
  });

  it("does not forward a request when production auth is misconfigured", async () => {
    mocks.assertAuthIsConfigured.mockImplementationOnce(() => {
      throw new Error("BETTER_AUTH_SECRET must be set before enabling production admin authentication.");
    });

    await expect(POST(new Request("http://localhost:3000/api/auth/sign-out", { method: "POST" })))
      .rejects.toThrow("BETTER_AUTH_SECRET");
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
