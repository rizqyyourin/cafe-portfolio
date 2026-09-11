import { describe, expect, it } from "vitest";

import { reservationSchema, type ReservationInput } from "@/lib/validations/reservation";

function futureDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function validReservation(overrides: Record<string, unknown> = {}) {
  return {
    name: "  Ahmad Pratama  ",
    phone: "+62 812 5555 8821",
    email: "ahmad@example.com",
    reservationDate: futureDate(),
    reservationTime: "19:00",
    guestCount: "4",
    specialRequest: "Window seat, please.",
    ...overrides,
  };
}

describe("reservationSchema", () => {
  it("accepts valid input and normalizes surrounding whitespace", () => {
    const result = reservationSchema.safeParse(validReservation());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.name).toBe("Ahmad Pratama");
    expect(result.data.guestCount).toBe(4);
  });

  it.each([
    ["a blank name", { name: "" }, "name"],
    ["a malformed phone number", { phone: "not-a-phone" }, "phone"],
    ["a malformed email", { email: "ahmad@" }, "email"],
    ["a missing date", { reservationDate: "" }, "reservationDate"],
    ["an impossible calendar date", { reservationDate: "2026-02-30" }, "reservationDate"],
    ["a date in the past", { reservationDate: "2000-01-01" }, "reservationDate"],
    ["a missing time", { reservationTime: "" }, "reservationTime"],
    ["a time before opening", { reservationTime: "07:59" }, "reservationTime"],
    ["a time after closing", { reservationTime: "22:01" }, "reservationTime"],
    ["a missing guest count", { guestCount: "" }, "guestCount"],
    ["zero guests", { guestCount: "0" }, "guestCount"],
    ["more than twenty guests", { guestCount: "21" }, "guestCount"],
    ["a fractional guest count", { guestCount: "2.5" }, "guestCount"],
    ["an oversized special request", { specialRequest: "x".repeat(501) }, "specialRequest"],
  ])("rejects %s", (_description, overrides, field) => {
    const result = reservationSchema.safeParse(validReservation(overrides));

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors[field as keyof ReservationInput]).toBeDefined();
  });

  it("allows an empty optional email and special request", () => {
    const result = reservationSchema.safeParse(validReservation({ email: "", specialRequest: "" }));

    expect(result.success).toBe(true);
  });
});
