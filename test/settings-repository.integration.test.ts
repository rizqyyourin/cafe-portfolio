import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getCafeSettings, saveCafeSettings } from "@/db/settings";
import * as schema from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-settings-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

const values = {
  cafeName: "Kōhi Coffee",
  tagline: "Coffee worth slowing down for.",
  description: "A modern neighbourhood specialty coffee shop in Kemang, Jakarta.",
  address: "Jl. Kemang Raya No. 28, Jakarta Selatan 12730",
  phone: "+62 21 5550 0188",
  whatsapp: "628111111111",
  email: "hello@kohicoffee.example",
  instagram: "https://instagram.com/kohicoffee",
  threads: "",
  twitter: "",
  tiktok: "",
  facebook: "",
  mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
  openingHours: { Monday: "08:00 - 22:00", Tuesday: "08:00 - 22:00", Wednesday: "08:00 - 22:00", Thursday: "08:00 - 22:00", Friday: "08:00 - 23:00", Saturday: "08:00 - 23:00", Sunday: "08:00 - 22:00" },
} as const;

beforeAll(async () => {
  await client.execute(`CREATE TABLE cafe_settings (id TEXT PRIMARY KEY NOT NULL, cafe_name TEXT NOT NULL, tagline TEXT NOT NULL, description TEXT NOT NULL, logo_url TEXT, address TEXT NOT NULL, phone TEXT NOT NULL, whatsapp TEXT NOT NULL, email TEXT NOT NULL, instagram TEXT, threads TEXT, twitter TEXT, tiktok TEXT, facebook TEXT, maps_url TEXT NOT NULL, opening_hours TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

describe("settings repository", () => {
  it("creates the default row when the database has not been seeded", async () => {
    expect(await getCafeSettings(testDb)).toBeNull();
    await saveCafeSettings(values, testDb);

    expect(await getCafeSettings(testDb)).toMatchObject({ cafeName: "Kōhi Coffee", openingHours: values.openingHours });
  });

  it("updates the single settings row and normalizes blank optional URLs to null", async () => {
    await saveCafeSettings({ ...values, cafeName: "Kōhi House", instagram: "", openingHours: { ...values.openingHours, Sunday: "Closed" } }, testDb);

    expect(await getCafeSettings(testDb)).toMatchObject({ cafeName: "Kōhi House", instagram: null, openingHours: { ...values.openingHours, Sunday: "Closed" } });
  });
});
