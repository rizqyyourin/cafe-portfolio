import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import type { GalleryImageInput } from "@/lib/validations/gallery";

import { galleryImage } from "./schema";

type GalleryDatabase = typeof db;

export type AdminGalleryImage = {
  id: string;
  imageUrl: string;
  caption: string;
  category: string;
  altText: string;
  displayOrder: number;
  isActive: boolean;
};

export class GalleryImageNotFoundError extends Error {
  constructor() {
    super("Gallery image not found.");
    this.name = "GalleryImageNotFoundError";
  }
}

const galleryColumns = {
  id: galleryImage.id,
  imageUrl: galleryImage.imageUrl,
  caption: galleryImage.caption,
  category: galleryImage.category,
  altText: galleryImage.altText,
  displayOrder: galleryImage.displayOrder,
  isActive: galleryImage.isActive,
};

export async function getGalleryPageData(database: GalleryDatabase = db) {
  const images = await database.select(galleryColumns).from(galleryImage).orderBy(asc(galleryImage.displayOrder), asc(galleryImage.caption));
  const categories = [...new Set(images.map((image) => image.category))].sort((left, right) => left.localeCompare(right));
  return { categories, images } satisfies { categories: string[]; images: AdminGalleryImage[] };
}

export async function getPublicGalleryImages(database: GalleryDatabase = db) {
  return database.select(galleryColumns).from(galleryImage).where(eq(galleryImage.isActive, true)).orderBy(asc(galleryImage.displayOrder), asc(galleryImage.caption));
}

export async function insertGalleryImage(values: GalleryImageInput, database: GalleryDatabase = db) {
  const id = randomUUID();
  await database.insert(galleryImage).values({ id, ...values });
  return id;
}

export async function updateGalleryImage(id: string, values: GalleryImageInput, database: GalleryDatabase = db) {
  const existing = await database.select({ id: galleryImage.id }).from(galleryImage).where(eq(galleryImage.id, id)).limit(1);
  if (!existing[0]) throw new GalleryImageNotFoundError();

  await database.update(galleryImage).set({ ...values, updatedAt: new Date() }).where(eq(galleryImage.id, id));
}

export async function deleteGalleryImage(id: string, database: GalleryDatabase = db) {
  const existing = await database.select({ id: galleryImage.id }).from(galleryImage).where(eq(galleryImage.id, id)).limit(1);
  if (!existing[0]) throw new GalleryImageNotFoundError();
  await database.delete(galleryImage).where(eq(galleryImage.id, id));
}
