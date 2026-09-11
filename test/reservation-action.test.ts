import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertReservation: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/db/reservations", () => ({
  insertReservation: mocks.insertReservation,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createReservation } from "@/actions/reservation";

function formData(overrides: Record<string, string> = {}) {
  const values = {
    name: "Ahmad Pratama",
    phone: "+62 812 5555 8821",
    reservationDate: "2099-08-14",
    reservationTime: "19:00",
    guestCount: "4",
    email: "",
    specialRequest: "Window seat, please.",
    ...overrides,
  };
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("createReservation", () => {
  beforeEach(() => {
    mocks.insertReservation.mockReset();
    mocks.insertReservation.mockResolvedValue("reservation-test-id");
  });

  it("persists a valid request and returns the confirmation state", async () => {
    const result = await createReservation({ success: false }, formData());

    expect(result).toEqual({
      success: true,
      message: "Reservation request received. Our team will contact you via WhatsApp to confirm it.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/reservations");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.insertReservation).toHaveBeenCalledWith({
      name: "Ahmad Pratama",
      phone: "+62 812 5555 8821",
      email: "",
      reservationDate: "2099-08-14",
      reservationTime: "19:00",
      guestCount: 4,
      specialRequest: "Window seat, please.",
    });
  });

  it("does not write invalid input and returns field-level errors", async () => {
    const result = await createReservation({ success: false }, formData({ guestCount: "0", phone: "invalid" }));

    expect(result.success).toBe(false);
    expect(result.errors?.guestCount).toBeDefined();
    expect(result.errors?.phone).toBeDefined();
    expect(mocks.insertReservation).not.toHaveBeenCalled();
  });

  it("converts a database failure into a safe user-facing error", async () => {
    const error = new Error("database unavailable");
    mocks.insertReservation.mockRejectedValueOnce(error);
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await createReservation({ success: false }, formData());

    expect(result).toEqual({
      success: false,
      message: "We could not save your request right now. Please try again.",
    });
    expect(result.message).not.toContain("database unavailable");
    expect(logSpy).toHaveBeenCalledWith("Reservation insert failed", "database unavailable");
    logSpy.mockRestore();
  });
});
