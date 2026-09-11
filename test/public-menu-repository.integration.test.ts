import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getPublicFeaturedMenuItems, getPublicMenuPageData } from "@/db/menu";
import * as schema from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-public-menu-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute("PRAGMA foreign_keys = ON");
  await client.execute(`CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, display_order INTEGER DEFAULT 0 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE menu_items (id TEXT PRIMARY KEY NOT NULL, category_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, price INTEGER NOT NULL, image_url TEXT, badge TEXT, is_featured INTEGER DEFAULT 0 NOT NULL, is_available INTEGER DEFAULT 1 NOT NULL, display_order INTEGER DEFAULT 0 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT)`);
  await client.execute(`INSERT INTO categories (id, name, slug, display_order, is_active, created_at, updated_at) VALUES ('category-coffee', 'Coffee', 'coffee', 1, 1, 100, 100), ('category-brunch', 'Brunch', 'brunch', 2, 1, 100, 100), ('category-hidden', 'Hidden', 'hidden', 3, 0, 100, 100)`);
  await client.execute(`INSERT INTO menu_items (id, category_id, name, slug, description, price, image_url, badge, is_featured, is_available, display_order, created_at, updated_at) VALUES ('menu-available', 'category-coffee', 'Kōhi Latte', 'kohi-latte', 'A silky house latte.', 38000, 'https://images.unsplash.com/photo-latte', 'Best Seller', 1, 1, 1, 100, 100), ('menu-sold-out', 'category-coffee', 'Sold Out Latte', 'sold-out-latte', 'A latte unavailable today.', 39000, NULL, NULL, 1, 0, 2, 100, 100), ('menu-hidden-category', 'category-hidden', 'Hidden Brunch', 'hidden-brunch', 'An unpublished category item.', 45000, NULL, NULL, 1, 1, 3, 100, 100)`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

describe("public menu repository", () => {
  it("returns available and sold-out items while hiding inactive categories", async () => {
    const result = await getPublicMenuPageData(testDb);

    expect(result.categories).toEqual([
      { id: "category-coffee", name: "Coffee" },
      { id: "category-brunch", name: "Brunch" },
    ]);
    expect(result.items).toHaveLength(2);
    expect(result.items[1]).toMatchObject({ id: "menu-sold-out", isAvailable: false });
    expect(result.items[0]).toMatchObject({
      id: "menu-available",
      categoryId: "category-coffee",
      categoryName: "Coffee",
      name: "Kōhi Latte",
      imageUrl: "https://images.unsplash.com/photo-latte",
    });
  });

  it("returns only available featured items from active categories", async () => {
    const result = await getPublicFeaturedMenuItems(testDb);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "menu-available", isFeatured: true });
  });

  it("orders items globally by display order across categories and resolves ties by item name", async () => {
    await client.execute(`INSERT INTO menu_items (id, category_id, name, slug, description, price, image_url, badge, is_featured, is_available, display_order, created_at, updated_at) VALUES ('menu-zero-alpha', 'category-brunch', 'Alpha Zero', 'alpha-zero', 'An item sharing the first display order.', 30000, NULL, NULL, 0, 1, 0, 100, 100), ('menu-zero-zeta', 'category-coffee', 'Zeta Zero', 'zeta-zero', 'Another item sharing the first display order.', 31000, NULL, NULL, 0, 1, 0, 100, 100)`);

    const result = await getPublicMenuPageData(testDb);

    expect(result.items.slice(0, 3).map((item) => item.name)).toEqual(["Alpha Zero", "Zeta Zero", "Kōhi Latte"]);
  });
});
