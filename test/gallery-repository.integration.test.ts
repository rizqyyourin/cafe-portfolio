import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteGalleryImage, getGalleryPageData, getPublicGalleryImages, insertGalleryImage, GalleryImageNotFoundError, updateGalleryImage } from "@/db/gallery";
import * as schema from "@/db/schema";
import { galleryImage } from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-gallery-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute(`CREATE TABLE gallery_images (id TEXT PRIMARY KEY NOT NULL, image_url TEXT NOT NULL, caption TEXT NOT NULL, category TEXT NOT NULL, alt_text TEXT NOT NULL, display_order INTEGER DEFAULT 0 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`INSERT INTO gallery_images VALUES ('gallery-1', 'https://images.unsplash.com/photo-1', 'Morning pour', 'coffee', 'Latte art', 1, 1, 100, 100), ('gallery-2', 'https://images.unsplash.com/photo-2', 'Private event', 'events', 'Event table', 2, 0, 100, 100)`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

const values = {
  imageUrl: "https://images.unsplash.com/photo-3",
  caption: "Sunlit tables",
  category: "interior",
  altText: "Sunlit cafe interior",
  displayOrder: 3,
  isActive: true,
} as const;

describe("gallery repository", () => {
  it("returns all admin images and distinct filter categories", async () => {
    const result = await getGalleryPageData(testDb);

    expect(result.categories).toEqual(["coffee", "events"]);
    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toMatchObject({ id: "gallery-1", caption: "Morning pour", isActive: true });
  });

  it("returns active images only for the public gallery", async () => {
    const result = await getPublicGalleryImages(testDb);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("gallery-1");
  });

  it("creates, updates, and deletes by id", async () => {
    const id = await insertGalleryImage(values, testDb);
    await updateGalleryImage(id, { ...values, caption: "Updated tables", isActive: false }, testDb);
    expect((await testDb.select({ caption: galleryImage.caption, isActive: galleryImage.isActive }).from(galleryImage).where(eq(galleryImage.id, id)))[0]).toEqual({ caption: "Updated tables", isActive: false });

    await deleteGalleryImage(id, testDb);
    expect(await testDb.select({ id: galleryImage.id }).from(galleryImage).where(eq(galleryImage.id, id))).toEqual([]);
    await expect(deleteGalleryImage("missing-gallery", testDb)).rejects.toBeInstanceOf(GalleryImageNotFoundError);
  });
});
