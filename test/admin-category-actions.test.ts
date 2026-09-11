import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => {
  class MockCategoryInUseError extends Error {
    menuItemCount: number;

    constructor(menuItemCount: number) {
      super(`Category still contains ${menuItemCount} menu items.`);
      this.menuItemCount = menuItemCount;
    }
  }

  return {
    requireAdminSession: vi.fn(),
    insertCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    revalidatePath: vi.fn(),
    CategoryInUseError: MockCategoryInUseError,
  };
});

vi.mock("@/lib/auth-guard", () => ({ requireAdminSession: actionMocks.requireAdminSession }));
vi.mock("@/db/categories", () => ({
  CategoryInUseError: actionMocks.CategoryInUseError,
  insertCategory: actionMocks.insertCategory,
  updateCategory: actionMocks.updateCategory,
  deleteCategory: actionMocks.deleteCategory,
}));
vi.mock("next/cache", () => ({ revalidatePath: actionMocks.revalidatePath }));

import { createCategory, deleteCategory, updateCategory } from "@/actions/admin-categories";

function validCategoryForm() {
  const form = new FormData();
  form.set("name", "Cold Drinks");
  form.set("slug", "cold-drinks");
  form.set("displayOrder", "4");
  form.set("isActive", "on");
  return form;
}

describe("category server actions", () => {
  beforeEach(() => {
    actionMocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    actionMocks.insertCategory.mockReset().mockResolvedValue("category-cold-drinks");
    actionMocks.updateCategory.mockReset().mockResolvedValue(undefined);
    actionMocks.deleteCategory.mockReset().mockResolvedValue(undefined);
    actionMocks.revalidatePath.mockReset();
  });

  it("creates a validated category behind the admin session boundary", async () => {
    const result = await createCategory(validCategoryForm());

    expect(actionMocks.insertCategory).toHaveBeenCalledWith({ name: "Cold Drinks", slug: "cold-drinks", displayOrder: 4, isActive: true });
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/categories");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/menu");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: true, message: "Category created." });
  });

  it("returns field errors for invalid input without writing", async () => {
    const form = validCategoryForm();
    form.set("name", "x");
    form.set("slug", "Not a slug");
    form.set("displayOrder", "-1");

    const result = await createCategory(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ name: expect.any(Array), slug: expect.any(Array), displayOrder: expect.any(Array) }));
    expect(actionMocks.insertCategory).not.toHaveBeenCalled();
  });

  it("updates the selected category and treats an unchecked active box as false", async () => {
    const form = validCategoryForm();
    form.set("id", "category-coffee");
    form.delete("isActive");

    const result = await updateCategory(form);

    expect(actionMocks.updateCategory).toHaveBeenCalledWith("category-coffee", { name: "Cold Drinks", slug: "cold-drinks", displayOrder: 4, isActive: false });
    expect(result).toEqual({ success: true, message: "Category updated." });
  });

  it("requires an explicit category id for update and delete", async () => {
    expect(await updateCategory(validCategoryForm())).toEqual({ success: false, errors: { id: ["Category is required."] } });
    expect(await deleteCategory(new FormData())).toEqual({ success: false, errors: { id: ["Category is required."] } });
    expect(actionMocks.updateCategory).not.toHaveBeenCalled();
    expect(actionMocks.deleteCategory).not.toHaveBeenCalled();
  });

  it("returns a safe in-use error without exposing database details", async () => {
    actionMocks.deleteCategory.mockRejectedValueOnce(new actionMocks.CategoryInUseError(2));
    const form = new FormData();
    form.set("id", "category-coffee");

    const result = await deleteCategory(form);

    expect(result.success).toBe(false);
    expect(result.message).not.toContain("CATEGORY_IN_USE");
    expect(result.message).toMatch(/reassign/i);
  });

  it("does not touch category data when authentication fails", async () => {
    actionMocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));

    await expect(deleteCategory(new FormData())).rejects.toThrow("redirect to login");
    expect(actionMocks.deleteCategory).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
