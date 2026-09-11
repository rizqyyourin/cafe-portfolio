import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReservationPageData: vi.fn(),
  requireAdminSession: vi.fn(),
  updateReservationStatus: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock("@/db/reservations", () => ({ getReservationPageData: mocks.getReservationPageData, RESERVATION_PAGE_SIZE: 10, updateReservationStatus: mocks.updateReservationStatus }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { getAdminReservationsPage, updateAdminReservationStatus } from "@/actions/admin-reservations";

function formData(overrides: Record<string, string> = {}) {
  const form = new FormData();
  form.set("reservationId", "reservation-1");
  form.set("status", "CONFIRMED");
  Object.entries(overrides).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe("reservation admin actions", () => {
  beforeEach(() => {
    mocks.getReservationPageData.mockReset().mockResolvedValue({ reservations: [], hasMore: false, nextOffset: null });
    mocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    mocks.updateReservationStatus.mockReset().mockResolvedValue(undefined);
    mocks.revalidatePath.mockReset();
  });

  it("requires admin access and loads a filtered reservation page", async () => {
    const request = { offset: 10, status: "CONFIRMED" as const, dateFilter: "month" as const, year: "2026", query: "nadia" };

    await getAdminReservationsPage(request);

    expect(mocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(mocks.getReservationPageData).toHaveBeenCalledWith(undefined, {
      dateFilter: "month",
      limit: 10,
      offset: 10,
      query: "nadia",
      status: "CONFIRMED",
      year: "2026",
    });
  });

  it("requires admin access, persists valid status, and revalidates both views", async () => {
    const result = await updateAdminReservationStatus(formData({ status: "COMPLETED" }));

    expect(mocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(mocks.updateReservationStatus).toHaveBeenCalledWith("reservation-1", "COMPLETED");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/reservations");
    expect(result).toEqual({ success: true, message: "Reservation marked completed." });
  });

  it("rejects missing or unsupported status without writing", async () => {
    const missingId = new FormData();
    missingId.set("status", "CONFIRMED");
    const invalidStatus = formData({ status: "ARCHIVED" });

    const missingResult = await updateAdminReservationStatus(missingId);
    const invalidResult = await updateAdminReservationStatus(invalidStatus);

    expect(missingResult.errors?.reservationId).toBeDefined();
    expect(invalidResult.errors?.status).toBeDefined();
    expect(mocks.updateReservationStatus).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("restores a cancelled reservation to pending", async () => {
    const result = await updateAdminReservationStatus(formData({ status: "PENDING" }));

    expect(mocks.updateReservationStatus).toHaveBeenCalledWith("reservation-1", "PENDING");
    expect(result).toEqual({ success: true, message: "Reservation restored." });
  });

  it("does not write when auth fails", async () => {
    mocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));

    await expect(updateAdminReservationStatus(formData())).rejects.toThrow("redirect to login");
    expect(mocks.updateReservationStatus).not.toHaveBeenCalled();
  });

  it("returns a safe error when the transition fails", async () => {
    mocks.updateReservationStatus.mockRejectedValueOnce(new Error("stale transition details"));
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await updateAdminReservationStatus(formData({ status: "CANCELLED" }));

    expect(result).toEqual({ success: false, message: "We could not update that reservation right now. Please refresh and try again." });
    expect(result.message).not.toContain("stale transition details");
    expect(logSpy).toHaveBeenCalledWith("Reservation status update failed", "stale transition details");
    logSpy.mockRestore();
  });
});
