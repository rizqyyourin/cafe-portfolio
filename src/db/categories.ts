import { randomUUID } from "node:crypto";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import type { CategoryInput } from "@/lib/validations/category";

import { category, menuItem } from "./schema";

type CategoryDatabase = typeof db;

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  menuItemCount: number;
};

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found.");
    this.name = "CategoryNotFoundError";
  }
}

export class CategoryInUseError extends Error {
  constructor(public readonly menuItemCount: number) {
    super(`Category still contains ${menuItemCount} menu item${menuItemCount === 1 ? "" : "s"}.`);
    this.name = "CategoryInUseError";
  }
}

export async function getCategoriesPageData(database: CategoryDatabase = db) {
  const categories = await database.select({
    id: category.id,
    name: category.name,
    slug: category.slug,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    menuItemCount: count(menuItem.id),
  }).from(category).leftJoin(menuItem, eq(menuItem.categoryId, category.id)).groupBy(category.id, category.name, category.slug, category.displayOrder, category.isActive).orderBy(asc(category.displayOrder), asc(category.name));

  return { categories } satisfies { categories: AdminCategory[] };
}

export async function insertCategory(values: CategoryInput, database: CategoryDatabase = db) {
  const id = randomUUID();
  await database.insert(category).values({ id, ...values });
  return id;
}

export async function updateCategory(id: string, values: CategoryInput, database: CategoryDatabase = db) {
  const existing = await database.select({ id: category.id }).from(category).where(eq(category.id, id)).limit(1);
  if (!existing[0]) throw new CategoryNotFoundError();

  await database.update(category).set({ ...values, updatedAt: new Date() }).where(eq(category.id, id));
}

export async function deleteCategory(id: string, database: CategoryDatabase = db) {
  const existing = await database.select({ id: category.id }).from(category).where(eq(category.id, id)).limit(1);
  if (!existing[0]) throw new CategoryNotFoundError();

  const usage = await database.select({ value: count(menuItem.id) }).from(menuItem).where(eq(menuItem.categoryId, id));
  const menuItemCount = usage[0]?.value ?? 0;
  if (menuItemCount > 0) throw new CategoryInUseError(menuItemCount);

  await database.delete(category).where(eq(category.id, id));
}
