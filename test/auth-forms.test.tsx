import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: authMocks.signInEmail },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a>,
}));

import { LoginForm } from "@/components/auth/login-form";

describe("internal auth forms", () => {
  beforeEach(() => {
    authMocks.signInEmail.mockReset();
  });

  it("keeps login blocked until required credentials are present", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    expect(screen.getByRole("textbox", { name: "Email address" })).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();

    await user.click(screen.getByRole("button", { name: /sign in to cms/i }));

    expect(authMocks.signInEmail).not.toHaveBeenCalled();
  });

  it("submits login credentials and targets the admin dashboard", async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ data: { user: { id: "owner-1" } }, error: null });
    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "sasha@kohicoffee.id");
    await user.type(screen.getByLabelText("Password"), "correct horse battery staple");
    await user.click(screen.getByRole("button", { name: /sign in to cms/i }));

    await waitFor(() => expect(authMocks.signInEmail).toHaveBeenCalledWith({
      email: "sasha@kohicoffee.id",
      password: "correct horse battery staple",
      callbackURL: "/admin",
    }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a login error returned by the auth service", async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ error: { message: "Invalid credentials" } });
    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "sasha@kohicoffee.id");
    await user.type(screen.getByLabelText("Password"), "wrong password");
    await user.click(screen.getByRole("button", { name: /sign in to cms/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  it("falls back to a useful message when login returns no error detail", async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ error: {} });
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("dev@cafe.co.id"), "owner@example.com");
    await user.type(screen.getByPlaceholderText("Cafe123@"), "wrong password");
    await user.click(screen.getByRole("button", { name: /sign in to cms/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not sign you in. Please try again.");
  });
});
