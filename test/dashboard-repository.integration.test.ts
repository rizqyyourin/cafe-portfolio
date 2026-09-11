import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDashboardData } from "@/db/dashboard";
import * as schema from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-dashboard-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute(`CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, display_order INTEGER DEFAULT 0 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE menu_items (id TEXT PRIMARY KEY NOT NULL, category_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, price INTEGER NOT NULL, image_url TEXT, badge TEXT, is_featured INTEGER DEFAULT 0 NOT NULL, is_available INTEGER DEFAULT 1 NOT NULL, display_order INTEGER DEFAULT 0 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE gallery_images (id TEXT PRIMARY KEY NOT NULL, image_url TEXT NOT NULL, caption TEXT NOT NULL, category TEXT NOT NULL, alt_text TEXT NOT NULL, display_order INTEGER DEFAULT 0 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`CREATE TABLE reservations (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, reservation_date TEXT NOT NULL, reservation_time TEXT NOT NULL, guest_count INTEGER NOT NULL, special_request TEXT, status TEXT DEFAULT 'PENDING' NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`INSERT INTO categories VALUES ('active', 'Coffee', 'coffee', 1, 1, 100, 100), ('inactive', 'Hidden', 'hidden', 2, 0, 100, 100)`);
  await client.execute(`INSERT INTO menu_items VALUES ('menu-1', 'active', 'Latte', 'latte', 'A smooth coffee drink.', 38000, NULL, NULL, 1, 1, 1, 100, 100), ('menu-2', 'active', 'Tea', 'tea', 'A fragrant tea drink.', 30000, NULL, NULL, 0, 1, 2, 100, 100)`);
  await client.execute(`INSERT INTO gallery_images VALUES ('gallery-1', 'https://example.com/one.jpg', 'One', 'coffee', 'One', 1, 1, 100, 200), ('gallery-2', 'https://example.com/two.jpg', 'Two', 'food', 'Two', 2, 0, 200, 300)`);
  await client.execute(`INSERT INTO reservations VALUES ('reservation-old', 'Old Guest', '081234567890', NULL, '2099-08-10', '12:00', 2, NULL, 'PENDING', 100, 100), ('reservation-soon', 'Soon Guest', '081234567890', NULL, '2099-08-11', '18:00', 4, 'Window seat', 'PENDING', 200, 200), ('reservation-confirmed', 'Confirmed Guest', '081234567890', NULL, '2099-08-12', '19:00', 2, NULL, 'CONFIRMED', 300, 300)`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

describe("getDashboardData", () => {
  it("returns counts, active categories, recent reservations, and all pending reservations", async () => {
    const result = await getDashboardData(testDb);

    expect(result.stats).toMatchObject({ menuItems: 2, featuredMenuItems: 1, categories: 2, activeCategories: 1, pendingReservations: 2, galleryImages: 2 });
    expect(result.categories).toEqual([{ id: "active", name: "Coffee" }]);
    expect(result.reservations.map((item) => item.id)).toEqual(["reservation-old", "reservation-soon", "reservation-confirmed"]);
    expect(result.pendingReservations.map((item) => item.id)).toEqual(["reservation-old", "reservation-soon"]);
  });

  it("returns safe empty collections when the dashboard tables are empty", async () => {
    await client.execute("DELETE FROM categories");
    await client.execute("DELETE FROM menu_items");
    await client.execute("DELETE FROM gallery_images");
    await client.execute("DELETE FROM reservations");

    const result = await getDashboardData(testDb);

    expect(result.stats).toMatchObject({ menuItems: 0, featuredMenuItems: 0, categories: 0, activeCategories: 0, pendingReservations: 0, galleryImages: 0, galleryUpdatedAt: null });
    expect(result.categories).toEqual([]);
    expect(result.reservations).toEqual([]);
    expect(result.pendingReservations).toEqual([]);
  });
});
