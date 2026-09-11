"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth-guard";
import { categorySchema } from "@/lib/validations/category";
import { CategoryInUseError, deleteCategory as deleteCategoryRecord, insertCategory, updateCategory as updateCategoryRecord } from "@/db/categories";

export type CategoryActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function categoryValues(formData: FormData) {
  return {
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    displayOrder: stringValue(formData, "displayOrder") || "0",
    isActive: formData.get("isActive") === "on",
  };
}

function revalidateCategories() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function createCategory(formData: FormData): Promise<CategoryActionState> {
  await requireAdminSession();
  const parsed = categorySchema.safeParse(categoryValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await insertCategory(parsed.data);
  } catch (error) {
    console.error("Category creation failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not save that category right now. Check the details and try again." };
  }

  revalidateCategories();
  return { success: true, message: "Category created." };
}

export async function updateCategory(formData: FormData): Promise<CategoryActionState> {
  await requireAdminSession();
  const id = stringValue(formData, "id").trim();
  if (!id) return { success: false, errors: { id: ["Category is required."] } };

  const parsed = categorySchema.safeParse(categoryValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateCategoryRecord(id, parsed.data);
  } catch (error) {
    console.error("Category update failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not update that category right now. Check the details and try again." };
  }

  revalidateCategories();
  return { success: true, message: "Category updated." };
}

export async function deleteCategory(formData: FormData): Promise<CategoryActionState> {
  await requireAdminSession();
  const id = stringValue(formData, "id").trim();
  if (!id) return { success: false, errors: { id: ["Category is required."] } };

  try {
    await deleteCategoryRecord(id);
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      return { success: false, message: `This category still contains ${error.menuItemCount} menu item${error.menuItemCount === 1 ? "" : "s"}. Reassign them before deleting.` };
    }
    console.error("Category deletion failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not delete that category right now. Please refresh and try again." };
  }

  revalidateCategories();
  return { success: true, message: "Category deleted." };
}
