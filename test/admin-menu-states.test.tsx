import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AdminMenuError from "@/app/admin/(dashboard)/menu/error";
import AdminMenuLoading from "@/app/admin/(dashboard)/menu/loading";

describe("menu loading and error states", () => {
  it("shows a menu-specific loading skeleton with an accessible status", () => {
    render(<AdminMenuLoading />);

    expect(screen.getByRole("status", { name: "Loading menu" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading menu");
  });

  it("explains a menu data failure and retries only when requested", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AdminMenuError error={new Error("Turso unavailable")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Menu unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was changed.");
    expect(reset).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
