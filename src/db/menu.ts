import { randomUUID } from "node:crypto";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import type { MenuItemInput } from "@/lib/validations/menu";

import { category, menuItem } from "./schema";

type MenuDatabase = typeof db;

/** Persist a validated menu item and return its stable id. */
export async function insertMenuItem(
  values: MenuItemInput,
  database: MenuDatabase = db,
) {
  const id = randomUUID();

  await database.insert(menuItem).values({
    id,
    categoryId: values.categoryId,
    name: values.name,
    slug: values.slug,
    description: values.description,
    price: values.price,
    imageUrl: values.imageUrl || null,
    badge: values.badge || null,
    isFeatured: values.isFeatured,
    isAvailable: values.isAvailable,
    displayOrder: values.displayOrder,
  });

  return id;
}

export type AdminMenuItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  badge: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
  displayOrder: number;
};

export class MenuItemNotFoundError extends Error {
  constructor() {
    super("Menu item not found.");
    this.name = "MenuItemNotFoundError";
  }
}

export type PublicMenuItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  badge: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
  displayOrder: number;
};

const publicMenuColumns = {
  id: menuItem.id,
  categoryId: menuItem.categoryId,
  categoryName: category.name,
  name: menuItem.name,
  slug: menuItem.slug,
  description: menuItem.description,
  price: menuItem.price,
  imageUrl: menuItem.imageUrl,
  badge: menuItem.badge,
  isFeatured: menuItem.isFeatured,
  isAvailable: menuItem.isAvailable,
  displayOrder: menuItem.displayOrder,
};

const publicMenuOrder = [asc(menuItem.displayOrder), asc(menuItem.name)] as const;

export async function getMenuPageData(database: MenuDatabase = db) {
  const [categories, items] = await Promise.all([
    database.select({ id: category.id, name: category.name }).from(category).where(eq(category.isActive, true)).orderBy(asc(category.displayOrder), asc(category.name)),
    database.select({
      id: menuItem.id,
      categoryId: menuItem.categoryId,
      categoryName: category.name,
      name: menuItem.name,
      slug: menuItem.slug,
      description: menuItem.description,
      price: menuItem.price,
      imageUrl: menuItem.imageUrl,
      badge: menuItem.badge,
      isFeatured: menuItem.isFeatured,
      isAvailable: menuItem.isAvailable,
      displayOrder: menuItem.displayOrder,
    }).from(menuItem).innerJoin(category, eq(menuItem.categoryId, category.id)).orderBy(asc(menuItem.displayOrder), asc(menuItem.name)),
  ]);

  return { categories, items } satisfies { categories: Array<{ id: string; name: string }>; items: AdminMenuItem[] };
}

/** Return the menu content that is currently published on the public website. */
export async function getPublicMenuPageData(database: MenuDatabase = db) {
  const [categories, items] = await Promise.all([
    database.select({ id: category.id, name: category.name }).from(category).where(eq(category.isActive, true)).orderBy(asc(category.displayOrder), asc(category.name)),
    database.select(publicMenuColumns).from(menuItem).innerJoin(category, eq(menuItem.categoryId, category.id)).where(eq(category.isActive, true)).orderBy(...publicMenuOrder),
  ]);

  return { categories, items } satisfies { categories: Array<{ id: string; name: string }>; items: PublicMenuItem[] };
}

/** Return the published featured items used by the homepage menu preview. */
export async function getPublicFeaturedMenuItems(database: MenuDatabase = db) {
  return database.select(publicMenuColumns).from(menuItem).innerJoin(category, eq(menuItem.categoryId, category.id)).where(and(eq(category.isActive, true), eq(menuItem.isAvailable, true), eq(menuItem.isFeatured, true))).orderBy(...publicMenuOrder).limit(3) satisfies Promise<PublicMenuItem[]>;
}

export async function updateMenuItem(
  id: string,
  values: MenuItemInput,
  database: MenuDatabase = db,
) {
  const existing = await database.select({ id: menuItem.id }).from(menuItem).where(eq(menuItem.id, id)).limit(1);
  if (!existing[0]) throw new MenuItemNotFoundError();

  await database.update(menuItem).set({
    categoryId: values.categoryId,
    name: values.name,
    slug: values.slug,
    description: values.description,
    price: values.price,
    imageUrl: values.imageUrl || null,
    badge: values.badge || null,
    isFeatured: values.isFeatured,
    isAvailable: values.isAvailable,
    displayOrder: values.displayOrder,
    updatedAt: new Date(),
  }).where(eq(menuItem.id, id));
}

export async function deleteMenuItem(id: string, database: MenuDatabase = db) {
  const existing = await database.select({ id: menuItem.id }).from(menuItem).where(eq(menuItem.id, id)).limit(1);
  if (!existing[0]) throw new MenuItemNotFoundError();
  await database.delete(menuItem).where(eq(menuItem.id, id));
}
