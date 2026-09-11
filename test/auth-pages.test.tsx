import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: vi.fn() },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a>,
}));

import LoginPage from "@/app/auth/login/page";

describe("internal auth pages", () => {
  it("renders the invite-only login experience with development placeholders", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Welcome back." })).toBeInTheDocument();
    expect(screen.getByText("Admin access")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("dev@cafe.co.id")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Cafe123@")).toBeInTheDocument();
    expect(screen.getByText("Development access: dev@cafe.co.id / Cafe123@")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create|register|sign up/i })).not.toBeInTheDocument();
  });

  it("does not expose a public registration page", () => {
    expect(existsSync(resolve(process.cwd(), "src/app/auth/register/page.tsx"))).toBe(false);
  });
});
