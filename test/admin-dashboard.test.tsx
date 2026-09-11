import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import { DashboardView, type CreateMenuItemAction, type DashboardData, type UpdateReservationStatusAction } from "@/components/admin/dashboard-view";

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
  createMenuItemAction?: CreateMenuItemAction;
  updateReservationStatusAction?: UpdateReservationStatusAction;
}) {
  const createMenuItemAction = actions?.createMenuItemAction ?? vi.fn().mockResolvedValue({ success: true, message: "Menu item created." });
  const updateReservationStatusAction = actions?.updateReservationStatusAction ?? vi.fn().mockResolvedValue({ success: true, message: "Reservation updated." });

  return {
    createMenuItemAction,
    updateReservationStatusAction,
    ...render(
      <DashboardView
        data={{ ...dashboardData, ...overrides }}
        createMenuItemAction={createMenuItemAction}
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

  it("opens the add menu modal and blocks an empty required submission", async () => {
    const user = userEvent.setup();
    const { createMenuItemAction } = renderDashboard();

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Name")).toBeRequired();

    await user.click(within(dialog).getByRole("button", { name: "Create menu item" }));

    expect(createMenuItemAction).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Add menu item" })).toBeInTheDocument();
  });

  it("explains why menu creation is unavailable when no active category exists", async () => {
    const user = userEvent.setup();
    const { createMenuItemAction } = renderDashboard({ categories: [] });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    expect(within(dialog).getByRole("status")).toHaveTextContent("Add a category before creating a menu item.");
    expect(within(dialog).getByRole("button", { name: "Create menu item" })).toBeDisabled();
    expect(createMenuItemAction).not.toHaveBeenCalled();
  });

  it("closes the add menu modal with its close control, overlay, and Escape", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    await user.click(screen.getByRole("button", { name: "Close add menu item dialog" }));
    expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    await user.click(screen.getByRole("button", { name: "Dismiss add menu item dialog" }));
    expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument();
  });

  it("shows server validation feedback and stays open after a rejected menu create", async () => {
    const user = userEvent.setup();
    const createMenuItemAction = vi.fn().mockResolvedValue({
      success: false,
      message: "A menu item with that slug already exists.",
      errors: { slug: ["Use a different slug."] },
    });
    const { createMenuItemAction: action } = renderDashboard({}, { createMenuItemAction });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    await user.type(within(dialog).getByLabelText("Name"), "New Latte");
    await user.type(within(dialog).getByLabelText("Slug"), "new-latte");
    await user.type(within(dialog).getByLabelText("Description"), "A smooth new latte for the menu.");
    await user.type(within(dialog).getByLabelText("Price (IDR)"), "38000");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "coffee");
    await user.click(within(dialog).getByRole("button", { name: "Create menu item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A menu item with that slug already exists.");
    expect(screen.getByText("Use a different slug.")).toBeInTheDocument();
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Add menu item" })).toBeInTheDocument();
  });

  it("surfaces unexpected menu create failures and clears the pending state", async () => {
    const user = userEvent.setup();
    const createMenuItemAction = vi.fn().mockRejectedValue(new Error("database unavailable"));
    renderDashboard({}, { createMenuItemAction });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    await user.type(within(dialog).getByLabelText("Name"), "New Latte");
    await user.type(within(dialog).getByLabelText("Slug"), "new-latte");
    await user.type(within(dialog).getByLabelText("Description"), "A smooth new latte for the menu.");
    await user.type(within(dialog).getByLabelText("Price (IDR)"), "38000");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "coffee");
    await user.click(within(dialog).getByRole("button", { name: "Create menu item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong while saving the menu item.");
    expect(within(screen.getByRole("dialog", { name: "Add menu item" })).getByRole("button", { name: "Create menu item" })).not.toBeDisabled();
  });

  it("prevents duplicate menu creates while the request is pending and refreshes after success", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const createMenuItemAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderDashboard({}, { createMenuItemAction });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    await user.type(within(dialog).getByLabelText("Name"), "New Latte");
    await user.type(within(dialog).getByLabelText("Slug"), "new-latte");
    await user.type(within(dialog).getByLabelText("Description"), "A smooth new latte for the menu.");
    await user.type(within(dialog).getByLabelText("Price (IDR)"), "38000");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "coffee");
    const submit = within(dialog).getByRole("button", { name: "Create menu item" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(createMenuItemAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Menu item created." });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument());
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
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
