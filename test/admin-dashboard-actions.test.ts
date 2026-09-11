import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  insertMenuItem: vi.fn(),
  updateReservationStatus: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdminSession: actionMocks.requireAdminSession,
}));
vi.mock("@/db/menu", () => ({
  insertMenuItem: actionMocks.insertMenuItem,
}));
vi.mock("@/db/reservations", () => ({
  updateReservationStatus: actionMocks.updateReservationStatus,
}));
vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

import { createMenuItem, updateAdminReservationStatus } from "@/actions/admin-dashboard";

function validMenuForm() {
  const form = new FormData();
  form.set("name", "New Latte");
  form.set("slug", "new-latte");
  form.set("description", "A smooth new latte for the menu.");
  form.set("price", "38000");
  form.set("categoryId", "coffee");
  form.set("imageUrl", "");
  form.set("badge", "New");
  form.set("displayOrder", "4");
  form.set("isFeatured", "on");
  form.set("isAvailable", "on");
  return form;
}

describe("dashboard server actions", () => {
  beforeEach(() => {
    actionMocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    actionMocks.insertMenuItem.mockReset().mockResolvedValue("menu-new-latte");
    actionMocks.updateReservationStatus.mockReset().mockResolvedValue(undefined);
    actionMocks.revalidatePath.mockReset();
  });

  it("requires an admin session, validates, persists, and revalidates a new menu item", async () => {
    const result = await createMenuItem(validMenuForm());

    expect(actionMocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(actionMocks.insertMenuItem).toHaveBeenCalledWith(expect.objectContaining({
      name: "New Latte",
      slug: "new-latte",
      price: 38000,
      categoryId: "coffee",
      isFeatured: true,
      isAvailable: true,
      displayOrder: 4,
    }));
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/menu");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/menu");
    expect(result).toEqual({ success: true, message: "Menu item created." });
  });

  it("returns field errors and never writes an invalid menu item", async () => {
    const form = validMenuForm();
    form.set("slug", "Not a slug");
    form.set("price", "38.5");

    const result = await createMenuItem(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ slug: expect.any(Array), price: expect.any(Array) }));
    expect(actionMocks.insertMenuItem).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("does not write when the admin session check fails", async () => {
    actionMocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));

    await expect(createMenuItem(validMenuForm())).rejects.toThrow("redirect to login");
    expect(actionMocks.insertMenuItem).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("converts a database failure into a safe menu error", async () => {
    actionMocks.insertMenuItem.mockRejectedValueOnce(new Error("unique constraint failed"));

    const result = await createMenuItem(validMenuForm());

    expect(result).toEqual({
      success: false,
      message: "We could not save the menu item right now. Check the details and try again.",
    });
  });

  it("requires an admin session before a reservation status can be changed", async () => {
    const form = new FormData();
    form.set("reservationId", "reservation-1");
    form.set("status", "CONFIRMED");

    await updateAdminReservationStatus(form);

    expect(actionMocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(actionMocks.updateReservationStatus).toHaveBeenCalledWith("reservation-1", "CONFIRMED");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/reservations");
  });

  it("rejects unsupported reservation status input without touching the database", async () => {
    const form = new FormData();
    form.set("reservationId", "reservation-1");
    form.set("status", "COMPLETED");

    const result = await updateAdminReservationStatus(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ status: expect.any(Array) }));
    expect(actionMocks.updateReservationStatus).not.toHaveBeenCalled();
  });

  it("returns a safe reservation error when the transition cannot be persisted", async () => {
    actionMocks.updateReservationStatus.mockRejectedValueOnce(new Error("invalid transition"));
    const form = new FormData();
    form.set("reservationId", "reservation-1");
    form.set("status", "CANCELLED");

    const result = await updateAdminReservationStatus(form);

    expect(result).toEqual({
      success: false,
      message: "We could not update that reservation right now. Please refresh and try again.",
    });
  });
});
