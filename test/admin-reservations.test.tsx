import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigationMocks }));

import { ReservationsView, type AdminReservation, type ReservationAction, type ReservationPageData } from "@/components/admin/reservations-view";

const reservations: AdminReservation[] = [
  {
    id: "reservation-1",
    name: "Nadia Ramadhani",
    phone: "+62 812 5555 8821",
    email: "nadia@example.com",
    reservationDate: "2099-08-12",
    reservationTime: "19:00",
    guestCount: 4,
    specialRequest: "Window seat if possible — celebrating a birthday.",
    status: "PENDING",
  },
  {
    id: "reservation-2",
    name: "Arga Pradana",
    phone: "081234567890",
    email: null,
    reservationDate: "2099-08-12",
    reservationTime: "20:30",
    guestCount: 2,
    specialRequest: null,
    status: "CONFIRMED",
  },
  {
    id: "reservation-3",
    name: "Clara Wibowo",
    phone: "+62 813 1111 2222",
    email: null,
    reservationDate: "2099-08-13",
    reservationTime: "18:30",
    guestCount: 6,
    specialRequest: null,
    status: "PENDING",
  },
  {
    id: "reservation-4",
    name: "Dimas Putra",
    phone: "+62 814 3333 4444",
    email: null,
    reservationDate: "2099-08-14",
    reservationTime: "12:00",
    guestCount: 3,
    specialRequest: null,
    status: "CONFIRMED",
  },
  {
    id: "reservation-5",
    name: "Fira Aulia",
    phone: "+62 815 5555 6666",
    email: null,
    reservationDate: "2099-08-21",
    reservationTime: "19:00",
    guestCount: 2,
    specialRequest: null,
    status: "CANCELLED",
  },
];

const data: ReservationPageData = {
  today: "2099-08-12",
  weekStart: "2099-08-10",
  weekEnd: "2099-08-16",
  pendingCount: 2,
  reservations,
};

function renderReservations(action?: ReservationAction) {
  const updateReservationStatusAction = action ?? vi.fn().mockResolvedValue({ success: true, message: "Reservation confirmed." });
  return { updateReservationStatusAction, ...render(<ReservationsView data={data} updateReservationStatusAction={updateReservationStatusAction} />) };
}

describe("reservations module", () => {
  beforeEach(() => navigationMocks.refresh.mockReset());

  it("renders the designed request list and selected detail with a safe WhatsApp link", () => {
    renderReservations();

    expect(screen.getByRole("heading", { name: "Table requests" })).toBeInTheDocument();
    expect(screen.getByText("2 pending confirmations need your attention")).toBeInTheDocument();
    expect(screen.getAllByText("Nadia Ramadhani").length).toBeGreaterThan(0);
    expect(screen.getByText("Today, 19:00")).toBeInTheDocument();
    expect(screen.getByText(/Window seat if possible — celebrating a birthday/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chat on WhatsApp" })).toHaveAttribute("href", "https://wa.me/6281255558821");
    expect(screen.getByRole("button", { name: "Confirm reservation" })).toBeInTheDocument();

    const requestRegion = screen.getByRole("region", { name: "Reservation requests" });
    expect(requestRegion).toHaveClass("overflow-x-auto");
    expect(within(requestRegion).getByText("Customer").parentElement).toHaveClass("min-w-[44rem]");
  });

  it("filters by status, today, and this week while preserving an empty state", async () => {
    const user = userEvent.setup();
    renderReservations();

    await user.selectOptions(screen.getByLabelText("Reservation status"), "PENDING");
    expect(screen.getByRole("button", { name: "Open request from Nadia Ramadhani" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open request from Arga Pradana" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Reservation period"), "today");
    expect(screen.getByRole("button", { name: "Open request from Nadia Ramadhani" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open request from Clara Wibowo" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Reservation status"), "COMPLETED");
    expect(screen.getByText("No table requests match these filters.")).toBeInTheDocument();
    await user.click(within(screen.getByRole("region", { name: "Reservation filters" })).getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("button", { name: "Open request from Nadia Ramadhani" })).toBeInTheDocument();
  });

  it("filters the current week, month and selected year, combined with status", async () => {
    const user = userEvent.setup();
    render(<ReservationsView data={{ ...data, reservations: [...reservations,
      { ...reservations[0], id: "next-month", name: "Next Month", reservationDate: "2099-09-01" },
      { ...reservations[0], id: "last-year", name: "Last Year", reservationDate: "2098-08-12" },
    ] }} updateReservationStatusAction={vi.fn()} />);
    const period = screen.getByRole("combobox", { name: "Reservation period" });
    await user.selectOptions(period, "week");
    expect(screen.getAllByRole("button", { name: /^Open request from/ })).toHaveLength(4);
    await user.selectOptions(period, "month");
    expect(screen.getAllByRole("button", { name: /^Open request from/ })).toHaveLength(5);
    await user.selectOptions(period, "year");
    expect(screen.getAllByRole("button", { name: /^Open request from/ })).toHaveLength(6);
    await user.selectOptions(screen.getByRole("combobox", { name: "Reservation year" }), "2098");
    expect(screen.getAllByRole("button", { name: /^Open request from/ })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Last Year" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Reservation status"), "CONFIRMED");
    expect(screen.getByText("No table requests match these filters.")).toBeInTheDocument();
  });

  it("renders the state-specific reservation detail actions", async () => {
    const user = userEvent.setup();
    renderReservations();

    await user.click(screen.getByRole("button", { name: "Open request from Arga Pradana" }));
    const confirmedDetail = screen.getByRole("region", { name: "Selected request" });
    expect(within(confirmedDetail).getByRole("heading", { name: "Arga Pradana" })).toBeInTheDocument();
    expect(within(confirmedDetail).getByText("CONFIRMED", { selector: "span" })).toBeInTheDocument();
    expect(within(confirmedDetail).getByRole("button", { name: "Edit reservation" })).toBeInTheDocument();
    expect(within(confirmedDetail).getByRole("link", { name: "Message guest" })).toHaveAttribute("href", "https://wa.me/6281234567890");
    expect(screen.queryByRole("button", { name: "Confirm reservation" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open request from Fira Aulia" }));
    const cancelledDetail = screen.getByRole("region", { name: "Selected request" });
    expect(within(cancelledDetail).getByText("CANCELLED", { selector: "span" })).toBeInTheDocument();
    expect(within(cancelledDetail).getByRole("button", { name: "Restore reservation" })).toBeInTheDocument();
    expect(within(cancelledDetail).getByRole("link", { name: "View message" })).toHaveAttribute("href", "https://wa.me/6281555556666");
  });

  it("updates a pending request once, refreshes, and shows the success state", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const action = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderReservations(action);

    const confirm = screen.getByRole("button", { name: "Confirm reservation" });
    await user.click(confirm);
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(action).toHaveBeenCalledOnce();
    expect(action.mock.calls[0]?.[0].get("reservationId")).toBe("reservation-1");
    expect(action.mock.calls[0]?.[0].get("status")).toBe("CONFIRMED");

    resolveAction({ success: true, message: "Reservation confirmed." });
    expect(await screen.findByRole("status")).toHaveTextContent("Reservation confirmed.");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the detail action available after a server failure", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: false, message: "That reservation can no longer be changed." });
    renderReservations(action);

    await user.click(screen.getByRole("button", { name: "Confirm reservation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That reservation can no longer be changed.");
    expect(screen.getByRole("button", { name: "Confirm reservation" })).not.toBeDisabled();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it("shows the right empty detail state when the reservation database is empty", () => {
    render(<ReservationsView data={{ ...data, pendingCount: 0, reservations: [] }} updateReservationStatusAction={vi.fn()} />);

    expect(screen.getByText("No table requests yet.")).toBeInTheDocument();
    expect(screen.getByText("Select a request to see its details.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm reservation" })).not.toBeInTheDocument();
  });
});
