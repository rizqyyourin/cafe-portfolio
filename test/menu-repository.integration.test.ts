import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteMenuItem, getMenuPageData, insertMenuItem, MenuItemNotFoundError, updateMenuItem } from "@/db/menu";
import * as schema from "@/db/schema";
import { menuItem } from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-menu-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute("PRAGMA foreign_keys = ON");
  await client.execute(`CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, display_order INTEGER DEFAULT 0 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE menu_items (id TEXT PRIMARY KEY NOT NULL, category_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, price INTEGER NOT NULL, image_url TEXT, badge TEXT, is_featured INTEGER DEFAULT 0 NOT NULL, is_available INTEGER DEFAULT 1 NOT NULL, display_order INTEGER DEFAULT 0 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT)`);
  await client.execute(`INSERT INTO categories (id, name, slug, display_order, is_active, created_at, updated_at) VALUES ('category-coffee', 'Coffee', 'coffee', 1, 1, unixepoch(), unixepoch())`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

const values = {
  categoryId: "category-coffee",
  name: "New Latte",
  slug: "new-latte",
  description: "A smooth new latte for the menu.",
  price: 38000,
  imageUrl: "",
  badge: "New",
  isFeatured: true,
  isAvailable: true,
  displayOrder: 4,
} as const;

describe("insertMenuItem", () => {
  it("writes a complete menu item and normalizes optional empty values to null", async () => {
    const id = await insertMenuItem(values, testDb);
    const rows = await testDb.select().from(menuItem).where(eq(menuItem.id, id));

    expect(rows[0]).toMatchObject({ id, categoryId: "category-coffee", name: "New Latte", price: 38000, imageUrl: null, badge: "New", isFeatured: true, isAvailable: true, displayOrder: 4 });
  });

  it("lets the database protect the unique slug invariant", async () => {
    await expect(insertMenuItem({ ...values, name: "Another Latte" }, testDb)).rejects.toThrow();
  });
});

describe("menu read and update operations", () => {
  it("returns menu items joined with their category metadata", async () => {
    const result = await getMenuPageData(testDb);

    expect(result.categories).toEqual([{ id: "category-coffee", name: "Coffee" }]);
    expect(result.items[0]).toMatchObject({ categoryId: "category-coffee", categoryName: "Coffee", name: "New Latte" });
  });

  it("updates and deletes by id, while rejecting stale ids", async () => {
    const item = (await getMenuPageData(testDb)).items[0]!;
    await updateMenuItem(item.id, { ...values, name: "Updated Latte", slug: "updated-latte" }, testDb);
    expect((await testDb.select({ name: menuItem.name }).from(menuItem).where(eq(menuItem.id, item.id)))[0]?.name).toBe("Updated Latte");

    await deleteMenuItem(item.id, testDb);
    expect((await testDb.select({ id: menuItem.id }).from(menuItem).where(eq(menuItem.id, item.id)))).toEqual([]);
    await expect(deleteMenuItem("missing-menu-item", testDb)).rejects.toBeInstanceOf(MenuItemNotFoundError);
  });
});
