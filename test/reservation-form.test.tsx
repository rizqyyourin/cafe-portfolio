import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createReservation: vi.fn(),
}));

vi.mock("@/actions/reservation", () => ({
  createReservation: mocks.createReservation,
}));

import { ReservationForm } from "@/components/reservation-form";

describe("ReservationForm", () => {
  beforeEach(() => {
    mocks.createReservation.mockReset();
    mocks.createReservation.mockResolvedValue({
      success: true,
      message: "Reservation request received.",
    });
  });

  it("requires every required field before submitting", async () => {
    const user = userEvent.setup();
    render(<ReservationForm />);

    expect(screen.getByRole("textbox", { name: /^Name/ })).toBeRequired();
    expect(screen.getByRole("textbox", { name: /^WhatsApp/ })).toBeRequired();
    expect(screen.getByRole("button", { name: /choose reservation date/i })).toHaveTextContent("Select date");
    expect(screen.getByLabelText(/^Time/)).toBeRequired();
    expect(screen.getByLabelText(/^Guests/)).toBeRequired();
    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveAttribute("placeholder", "Enter your name");
    expect(screen.getByRole("textbox", { name: /^WhatsApp/ })).toHaveAttribute("placeholder", "Enter your phone number");
    expect(screen.getByRole("textbox", { name: /special request/i })).toHaveAttribute("placeholder", "Add any special request");
    expect(screen.queryByText(/\/ optional/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /request reservation/i }));

    expect(mocks.createReservation).not.toHaveBeenCalled();
  });

  it("defaults date and time to the current Jakarta date and time", async () => {
    render(<ReservationForm defaultDate="2026-09-10" defaultTime="17:56" />);

    expect(screen.getByRole("button", { name: /choose reservation date/i })).toHaveTextContent("10/09/2026");
    expect(document.querySelector('input[name="reservationDate"]')).toHaveValue("2026-09-10");
    expect(screen.getByLabelText(/^Time/)).toHaveValue("17:56");
  });

  it("opens the custom date picker, blocks past dates, and updates the form value", async () => {
    const user = userEvent.setup();
    render(<ReservationForm defaultDate="2026-09-10" defaultTime="12:30" />);

    await user.click(screen.getByRole("button", { name: /choose reservation date/i }));

    const calendar = screen.getByRole("dialog", { name: "Reservation date calendar" });
    expect(calendar).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /September 9th, 2026/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /September 15th, 2026/ }));

    expect(screen.queryByRole("dialog", { name: "Reservation date calendar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose reservation date/i })).toHaveTextContent("15/09/2026");
    expect(document.querySelector('input[name="reservationDate"]')).toHaveValue("2026-09-15");
  });

  it("lets users change time through the clickable dropdown", async () => {
    const user = userEvent.setup();
    render(<ReservationForm defaultDate="2026-09-10" defaultTime="12:30" />);

    const timeField = screen.getByLabelText(/^Time/);
    await user.click(timeField);
    await user.selectOptions(timeField, "18:00");

    expect(timeField).toHaveValue("18:00");
    expect(screen.getByRole("option", { name: "08:00" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "22:00" })).toBeInTheDocument();
  });

  it("closes the date picker with Escape and outside interaction", async () => {
    const user = userEvent.setup();
    render(<ReservationForm defaultDate="2026-09-10" defaultTime="12:30" />);

    const trigger = screen.getByRole("button", { name: /choose reservation date/i });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Reservation date calendar" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Reservation date calendar" })).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(document.body);
    expect(screen.queryByRole("dialog", { name: "Reservation date calendar" })).not.toBeInTheDocument();
  });

  it("submits the complete form and renders the success state", async () => {
    const user = userEvent.setup();
    render(<ReservationForm defaultDate="2099-08-14" defaultTime="19:00" />);

    await user.type(screen.getByRole("textbox", { name: /^Name/ }), "Ahmad Pratama");
    await user.type(screen.getByRole("textbox", { name: /^WhatsApp/ }), "+62 812 5555 8821");
    await user.selectOptions(screen.getByLabelText(/^Guests/), "4");
    await user.type(screen.getByRole("textbox", { name: /special request/i }), "Window seat, please.");
    await user.click(screen.getByRole("button", { name: /request reservation/i }));

    await waitFor(() => expect(mocks.createReservation).toHaveBeenCalledTimes(1));
    const submittedData = mocks.createReservation.mock.calls[0]?.[1] as FormData;

    expect(Object.fromEntries(submittedData.entries())).toMatchObject({
      name: "Ahmad Pratama",
      phone: "+62 812 5555 8821",
      reservationDate: "2099-08-14",
      reservationTime: "19:00",
      guestCount: "4",
      specialRequest: "Window seat, please.",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Reservation request received.");
  });
});
