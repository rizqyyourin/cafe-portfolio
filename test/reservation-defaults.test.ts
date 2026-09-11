import { describe, expect, it } from "vitest";

import { getReservationDefaults } from "@/lib/reservation-defaults";

describe("getReservationDefaults", () => {
  it("formats a UTC instant as the matching Jakarta date and time", () => {
    const result = getReservationDefaults(new Date("2026-09-10T05:30:00.000Z"));

    expect(result).toEqual({ date: "2026-09-10", time: "12:30" });
  });

  it("handles the date boundary in Jakarta instead of UTC", () => {
    const result = getReservationDefaults(new Date("2026-09-10T17:30:00.000Z"));

    expect(result).toEqual({ date: "2026-09-11", time: "00:30" });
  });
});
