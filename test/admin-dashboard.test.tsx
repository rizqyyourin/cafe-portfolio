import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import { DashboardView, type DashboardData, type UpdateReservationStatusAction } from "@/components/admin/dashboard-view";

const dashboardData: DashboardData = {
  greetingName: "Sasha",
  dateLabel: "Tuesday, 12 Aug",
  stats: {
    menuItems: 24,
    featuredMenuItems: 3,
    categories: 6,
    activeCategories: 6,
    pendingReservations: 5,
    pendingToday: 2,
    galleryImages: 18,
    galleryUpdatedLabel: "last updated yesterday",
  },
  categories: [
    { id: "coffee", name: "Coffee" },
    { id: "breakfast", name: "Breakfast" },
  ],
  reservations: [
    {
      id: "reservation-1",
      name: "Nadia Ramadhani",
      reservationDate: "2026-08-12",
      reservationTime: "19:00",
      guestCount: 4,
      status: "PENDING",
      specialRequest: "A quiet table, please.",
    },
    {
      id: "reservation-2",
      name: "Arga Pradana",
      reservationDate: "2026-08-12",
      reservationTime: "20:30",
      guestCount: 2,
      status: "CONFIRMED",
      specialRequest: null,
    },
  ],
};

function renderDashboard(overrides: Partial<DashboardData> = {}, actions?: {
  updateReservationStatusAction?: UpdateReservationStatusAction;
}) {
  const updateReservationStatusAction = actions?.updateReservationStatusAction ?? vi.fn().mockResolvedValue({ success: true, message: "Reservation updated." });

  return {
    updateReservationStatusAction,
    ...render(
      <DashboardView
        data={{ ...dashboardData, ...overrides }}
        updateReservationStatusAction={updateReservationStatusAction}
      />,
    ),
  };
}

describe("dashboard module", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
  });

  it("matches the designed overview hierarchy and uses the supplied dashboard data", () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Good morning, Sasha." })).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-date")).toHaveTextContent("Tuesday, 12 Aug");
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("3 featured")).toBeInTheDocument();
    expect(screen.getByText("Five tables are waiting for your confirmation.")).toBeInTheDocument();
    expect(screen.getByText("Nadia Ramadhani")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("keeps the recent reservation area useful when there are no reservations", () => {
    renderDashboard({ reservations: [] });

    expect(screen.getByText("No reservations yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review reservations" })).toBeInTheDocument();
  });

  it("does not expose menu creation from the overview", () => {
    renderDashboard();

    expect(screen.queryByRole("button", { name: /add menu item/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument();
  });

  it("opens an empty review state when there are no pending reservations", async () => {
    const user = userEvent.setup();
    renderDashboard({ reservations: dashboardData.reservations.map((item) => ({ ...item, status: "CONFIRMED" as const })) });

    await user.click(screen.getByRole("button", { name: "Review reservations" }));
    expect(screen.getByRole("dialog", { name: "Review reservations" })).toHaveTextContent("No pending reservations.");
  });

  it("updates a pending reservation and prevents duplicate status requests", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const updateReservationStatusAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderDashboard({}, { updateReservationStatusAction });

    await user.click(screen.getByRole("button", { name: "Review reservations" }));
    const dialog = screen.getByRole("dialog", { name: "Review reservations" });
    const confirm = within(dialog).getByRole("button", { name: "Confirm Nadia Ramadhani" });
    await user.click(confirm);
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(updateReservationStatusAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Reservation confirmed." });
    expect(await screen.findByText("Reservation confirmed.")).toBeInTheDocument();
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows a reservation update failure without losing the review modal", async () => {
    const user = userEvent.setup();
    const updateReservationStatusAction = vi.fn().mockResolvedValue({
      success: false,
      message: "That reservation can no longer be changed.",
    });
    renderDashboard({}, { updateReservationStatusAction });

    await user.click(screen.getByRole("button", { name: "Review reservations" }));
    const dialog = screen.getByRole("dialog", { name: "Review reservations" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel Nadia Ramadhani" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That reservation can no longer be changed.");
    expect(screen.getByRole("dialog", { name: "Review reservations" })).toBeInTheDocument();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });
});
