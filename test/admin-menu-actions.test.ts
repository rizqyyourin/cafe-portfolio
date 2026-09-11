import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  insertMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireAdminSession: actionMocks.requireAdminSession }));
vi.mock("@/db/menu", () => ({
  insertMenuItem: actionMocks.insertMenuItem,
  updateMenuItem: actionMocks.updateMenuItem,
  deleteMenuItem: actionMocks.deleteMenuItem,
}));
vi.mock("next/cache", () => ({ revalidatePath: actionMocks.revalidatePath }));

import { createMenuItem, deleteMenuItem, updateMenuItem } from "@/actions/admin-menu";

function validMenuForm() {
  const form = new FormData();
  form.set("name", "New Mocha");
  form.set("slug", "new-mocha");
  form.set("description", "A chocolate espresso drink for the menu.");
  form.set("price", "45000");
  form.set("categoryId", "coffee");
  form.set("imageUrl", "");
  form.set("badge", "New");
  form.set("displayOrder", "4");
  form.set("isAvailable", "on");
  return form;
}

describe("menu server actions", () => {
  beforeEach(() => {
    actionMocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    actionMocks.insertMenuItem.mockReset().mockResolvedValue("menu-new");
    actionMocks.updateMenuItem.mockReset().mockResolvedValue(undefined);
    actionMocks.deleteMenuItem.mockReset().mockResolvedValue(undefined);
    actionMocks.revalidatePath.mockReset();
  });

  it("creates a validated menu item behind the admin session boundary", async () => {
    const result = await createMenuItem(validMenuForm());

    expect(actionMocks.insertMenuItem).toHaveBeenCalledWith(expect.objectContaining({ name: "New Mocha", price: 45000, isAvailable: true, isFeatured: false }));
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/menu");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/menu");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: true, message: "Menu item created." });
  });

  it("returns field errors for invalid creation input without writing", async () => {
    const form = validMenuForm();
    form.set("name", "x");
    form.set("slug", "Not a slug");
    form.set("price", "-1");

    const result = await createMenuItem(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ name: expect.any(Array), slug: expect.any(Array), price: expect.any(Array) }));
    expect(actionMocks.insertMenuItem).not.toHaveBeenCalled();
  });

  it("updates the selected item and preserves checkbox values from FormData", async () => {
    const form = validMenuForm();
    form.set("id", "menu-1");
    form.set("isFeatured", "on");

    const result = await updateMenuItem(form);

    expect(actionMocks.updateMenuItem).toHaveBeenCalledWith("menu-1", expect.objectContaining({ isFeatured: true, isAvailable: true }));
    expect(result).toEqual({ success: true, message: "Menu item updated." });
  });

  it("persists an unchecked availability checkbox as false", async () => {
    const form = validMenuForm();
    form.set("id", "menu-1");
    form.delete("isAvailable");

    await updateMenuItem(form);

    expect(actionMocks.updateMenuItem).toHaveBeenCalledWith("menu-1", expect.objectContaining({ isAvailable: false }));
  });

  it("rejects an update without an item id and does not write", async () => {
    const result = await updateMenuItem(validMenuForm());

    expect(result).toEqual({ success: false, errors: { id: ["Menu item is required."] } });
    expect(actionMocks.updateMenuItem).not.toHaveBeenCalled();
  });

  it("deletes only the explicitly selected item and revalidates public menu", async () => {
    const form = new FormData();
    form.set("id", "menu-1");

    const result = await deleteMenuItem(form);

    expect(actionMocks.deleteMenuItem).toHaveBeenCalledWith("menu-1");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/menu");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/menu");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: true, message: "Menu item deleted." });
  });

  it("returns safe failure feedback for invalid input and persistence errors", async () => {
    const invalid = new FormData();
    const invalidResult = await deleteMenuItem(invalid);
    expect(invalidResult).toEqual({ success: false, errors: { id: ["Menu item is required."] } });

    actionMocks.updateMenuItem.mockRejectedValueOnce(new Error("database unavailable"));
    const updateForm = validMenuForm();
    updateForm.set("id", "menu-1");
    const failedResult = await updateMenuItem(updateForm);
    expect(failedResult).toEqual({ success: false, message: "We could not save that menu item right now. Please try again." });
  });

  it("does not touch menu data when authentication fails", async () => {
    actionMocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));

    await expect(deleteMenuItem(new FormData())).rejects.toThrow("redirect to login");
    expect(actionMocks.deleteMenuItem).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
