import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signOut: vi.fn(),
  push: vi.fn(),
  usePathname: vi.fn(() => "/reservation"),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: authMocks.signInEmail },
    signOut: authMocks.signOut,
  },
}));
vi.mock("next/navigation", () => ({
  usePathname: authMocks.usePathname,
  useRouter: () => ({ push: authMocks.push }),
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span aria-label={alt ?? ""} role="img" />,
}));

import { LoginForm } from "@/components/auth/login-form";
import { LogoutButton } from "@/components/admin/logout-button";
import { MenuCatalog } from "@/components/menu-catalog";
import { PublicHeader } from "@/components/layout/public-header";

describe("admin and navigation interactions", () => {
  beforeEach(() => {
    authMocks.signInEmail.mockReset();
    authMocks.signOut.mockReset();
    authMocks.push.mockReset();
    authMocks.usePathname.mockReturnValue("/reservation");
  });

  it("submits admin login credentials and redirects through the callback URL", async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ data: { user: { id: "owner-1" } }, error: null });
    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "owner@example.com");
    await user.type(screen.getByLabelText("Password"), "correct horse battery staple");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(authMocks.signInEmail).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "correct horse battery staple",
      callbackURL: "/admin",
    }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("surfaces a failed admin login without redirecting", async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockResolvedValue({ error: { message: "Invalid credentials" } });
    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "owner@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(authMocks.push).not.toHaveBeenCalled();
  });

  it("surfaces a sign-in network failure and clears the pending state", async () => {
    const user = userEvent.setup();
    authMocks.signInEmail.mockRejectedValueOnce(new Error("network unavailable"));
    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "owner@example.com");
    await user.type(screen.getByLabelText("Password"), "correct horse battery staple");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("could not connect to the sign-in service");
    expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
  });

  it("signs out and routes the owner back to the login page", async () => {
    const user = userEvent.setup();
    authMocks.signOut.mockResolvedValue({ data: null, error: null });
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(authMocks.signOut).toHaveBeenCalledOnce());
    expect(authMocks.push).toHaveBeenCalledWith("/auth/login");
  });

  it("surfaces a failed sign-out without redirecting", async () => {
    const user = userEvent.setup();
    authMocks.signOut.mockResolvedValue({ error: { message: "Session service unavailable" } });
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Session service unavailable");
    expect(authMocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /sign out/i })).not.toBeDisabled();
  });

  it("opens and closes the mobile navigation with the toggle and Escape", async () => {
    const user = userEvent.setup();
    render(<PublicHeader />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("link", { name: "Reserve a table" })).not.toBeInTheDocument();
    expect(toggle.querySelector(".lucide-menu")).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toHaveAttribute("aria-hidden", "false");
    expect(toggle.querySelector(".lucide-x")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    await user.click(within(screen.getByRole("navigation", { name: "Mobile navigation" })).getByRole("link", { name: "Home" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("filters the menu and exposes an empty state for categories without items", async () => {
    const user = userEvent.setup();
    render(<MenuCatalog categories={[{ id: "coffee", name: "Coffee" }, { id: "non-coffee", name: "Non-coffee" }, { id: "tea", name: "Tea" }, { id: "brunch", name: "Brunch" }, { id: "sweets", name: "Sweets" }]} items={[
      { id: "cappuccino", categoryId: "coffee", categoryName: "Coffee", name: "Cappuccino", slug: "cappuccino", description: "Double espresso, velvety milk.", price: 32000, imageUrl: null, badge: null, isFeatured: false, isAvailable: true, displayOrder: 1 },
      { id: "truffle-scramble", categoryId: "brunch", categoryName: "Brunch", name: "Truffle Scramble", slug: "truffle-scramble", description: "Soft eggs, sourdough, parmesan.", price: 78000, imageUrl: null, badge: null, isFeatured: false, isAvailable: true, displayOrder: 2 },
    ]} />);

    expect(screen.getByRole("heading", { name: "Cappuccino" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Brunch" }));
    expect(screen.getByRole("heading", { name: "Truffle Scramble" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cappuccino" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Tea" }));
    expect(screen.getByText("No menu items in this category just yet.")).toBeInTheDocument();
  });
});
