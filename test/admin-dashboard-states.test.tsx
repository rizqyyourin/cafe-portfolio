import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AdminDashboardError from "@/app/admin/(dashboard)/error";
import AdminDashboardLoading from "@/app/admin/(dashboard)/loading";

describe("dashboard loading and error states", () => {
  it("shows a non-destructive loading skeleton with an accessible status", () => {
    render(<AdminDashboardLoading />);

    expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading dashboard");
  });

  it("explains the data failure and retries only when requested", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AdminDashboardError error={new Error("Turso unavailable")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Dashboard unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was changed.");
    expect(reset).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
