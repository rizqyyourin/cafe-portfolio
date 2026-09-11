import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteCategory, getCategoriesPageData, insertCategory, CategoryInUseError, CategoryNotFoundError, updateCategory } from "@/db/categories";
import * as schema from "@/db/schema";
import { category } from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-category-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute("PRAGMA foreign_keys = ON");
  await client.execute(`CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, display_order INTEGER DEFAULT 0 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE menu_items (id TEXT PRIMARY KEY NOT NULL, category_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, price INTEGER NOT NULL, image_url TEXT, badge TEXT, is_featured INTEGER DEFAULT 0 NOT NULL, is_available INTEGER DEFAULT 1 NOT NULL, display_order INTEGER DEFAULT 0 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT)`);
  await client.execute(`INSERT INTO categories (id, name, slug, display_order, is_active, created_at, updated_at) VALUES ('coffee', 'Coffee', 'coffee', 1, 1, unixepoch(), unixepoch()), ('hidden', 'Hidden', 'hidden', 2, 0, unixepoch(), unixepoch())`);
  await client.execute(`INSERT INTO menu_items (id, category_id, name, slug, description, price, display_order, created_at, updated_at) VALUES ('menu-1', 'coffee', 'Latte', 'latte', 'A smooth coffee drink.', 38000, 1, unixepoch(), unixepoch())`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

describe("category repository", () => {
  it("returns every category with menu item counts in display order", async () => {
    const result = await getCategoriesPageData(testDb);

    expect(result).toEqual({ categories: [
      { id: "coffee", name: "Coffee", slug: "coffee", displayOrder: 1, isActive: true, menuItemCount: 1 },
      { id: "hidden", name: "Hidden", slug: "hidden", displayOrder: 2, isActive: false, menuItemCount: 0 },
    ] });
  });

  it("creates and updates category fields", async () => {
    const id = await insertCategory({ name: "Tea", slug: "tea", displayOrder: 3, isActive: true }, testDb);
    await updateCategory(id, { name: "Tea & Refreshers", slug: "tea-refreshers", displayOrder: 4, isActive: false }, testDb);

    expect((await testDb.select({ name: category.name, slug: category.slug, isActive: category.isActive }).from(category).where(eq(category.id, id)))[0]).toEqual({ name: "Tea & Refreshers", slug: "tea-refreshers", isActive: false });
  });

  it("blocks deleting a category with menu items", async () => {
    await expect(deleteCategory("coffee", testDb)).rejects.toBeInstanceOf(CategoryInUseError);
  });

  it("deletes an unused category and rejects stale ids", async () => {
    await deleteCategory("hidden", testDb);
    expect(await testDb.select({ id: category.id }).from(category).where(eq(category.id, "hidden"))).toEqual([]);
    await expect(deleteCategory("missing-category", testDb)).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
