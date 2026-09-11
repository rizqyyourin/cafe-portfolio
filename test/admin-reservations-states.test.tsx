import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AdminReservationsError from "@/app/admin/(dashboard)/reservations/error";
import AdminReservationsLoading from "@/app/admin/(dashboard)/reservations/loading";

describe("reservations loading and error states", () => {
  it("shows a non-destructive accessible loading skeleton", () => {
    render(<AdminReservationsLoading />);

    expect(screen.getByRole("status", { name: "Loading reservations" })).toBeInTheDocument();
  });

  it("surfaces a safe error and only retries after an explicit click", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AdminReservationsError error={new Error("database unavailable")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Reservations unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was changed.");
    expect(reset).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
