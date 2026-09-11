"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deleteMenuItem as removeMenuItem, insertMenuItem, updateMenuItem as saveMenuItem } from "@/db/menu";
import { requireAdminSession } from "@/lib/auth-guard";
import { menuItemSchema } from "@/lib/validations/menu";

export type MenuActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function menuValues(formData: FormData) {
  return {
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    description: stringValue(formData, "description"),
    price: stringValue(formData, "price"),
    categoryId: stringValue(formData, "categoryId"),
    imageUrl: stringValue(formData, "imageUrl"),
    badge: stringValue(formData, "badge"),
    displayOrder: stringValue(formData, "displayOrder") || "0",
    isFeatured: formData.get("isFeatured") === "on",
    isAvailable: formData.get("isAvailable") === "on",
  };
}

function revalidateMenu() {
  revalidatePath("/admin");
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function createMenuItem(formData: FormData): Promise<MenuActionState> {
  await requireAdminSession();
  const parsed = menuItemSchema.safeParse(menuValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await insertMenuItem(parsed.data);
  } catch (error) {
    console.error("Menu item insert failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not save the menu item right now. Check the details and try again." };
  }

  revalidateMenu();
  return { success: true, message: "Menu item created." };
}

const menuItemIdSchema = z.string().trim().min(1, "Menu item is required.");

export async function updateMenuItem(formData: FormData): Promise<MenuActionState> {
  await requireAdminSession();
  const id = menuItemIdSchema.safeParse(stringValue(formData, "id"));
  if (!id.success) return { success: false, errors: { id: id.error.issues.map((issue) => issue.message) } };

  const parsed = menuItemSchema.safeParse(menuValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await saveMenuItem(id.data, parsed.data);
  } catch (error) {
    console.error("Menu item update failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not save that menu item right now. Please try again." };
  }

  revalidateMenu();
  return { success: true, message: "Menu item updated." };
}

export async function deleteMenuItem(formData: FormData): Promise<MenuActionState> {
  await requireAdminSession();
  const id = menuItemIdSchema.safeParse(stringValue(formData, "id"));
  if (!id.success) return { success: false, errors: { id: id.error.issues.map((issue) => issue.message) } };

  try {
    await removeMenuItem(id.data);
  } catch (error) {
    console.error("Menu item delete failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not delete that menu item right now. Please refresh and try again." };
  }

  revalidateMenu();
  return { success: true, message: "Menu item deleted." };
}
