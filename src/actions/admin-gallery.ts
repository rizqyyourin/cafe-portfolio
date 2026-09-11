"use server";

import { revalidatePath } from "next/cache";

import { deleteGalleryImage as deleteGalleryImageRecord, insertGalleryImage, updateGalleryImage as updateGalleryImageRecord } from "@/db/gallery";
import { requireAdminSession } from "@/lib/auth-guard";
import { galleryImageSchema } from "@/lib/validations/gallery";
import { resolveUnsplashImageUrl } from "@/lib/unsplash";

export type GalleryActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function galleryImageValues(formData: FormData) {
  return {
    imageUrl: stringValue(formData, "imageUrl"),
    caption: stringValue(formData, "caption"),
    category: stringValue(formData, "category"),
    altText: stringValue(formData, "altText"),
    displayOrder: stringValue(formData, "displayOrder") || "0",
    isActive: formData.get("isActive") === "on",
  };
}

function revalidateGallery() {
  revalidatePath("/admin");
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function createGalleryImage(formData: FormData): Promise<GalleryActionState> {
  await requireAdminSession();
  const parsed = galleryImageSchema.safeParse(galleryImageValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    try {
      parsed.data.imageUrl = await resolveUnsplashImageUrl(parsed.data.imageUrl);
    } catch {
      return { success: false, errors: { imageUrl: ["Could not load this Unsplash photo. Try again or paste its images.unsplash.com image URL."] } };
    }
    await insertGalleryImage(parsed.data);
  } catch (error) {
    console.error("Gallery image creation failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not save that image right now. Check the details and try again." };
  }

  revalidateGallery();
  return { success: true, message: "Gallery image created." };
}

export async function updateGalleryImage(formData: FormData): Promise<GalleryActionState> {
  await requireAdminSession();
  const id = stringValue(formData, "id").trim();
  if (!id) return { success: false, errors: { id: ["Gallery image is required."] } };

  const parsed = galleryImageSchema.safeParse(galleryImageValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    try {
      parsed.data.imageUrl = await resolveUnsplashImageUrl(parsed.data.imageUrl);
    } catch {
      return { success: false, errors: { imageUrl: ["Could not load this Unsplash photo. Try again or paste its images.unsplash.com image URL."] } };
    }
    await updateGalleryImageRecord(id, parsed.data);
  } catch (error) {
    console.error("Gallery image update failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not update that image right now. Check the details and try again." };
  }

  revalidateGallery();
  return { success: true, message: "Gallery image updated." };
}

export async function deleteGalleryImage(formData: FormData): Promise<GalleryActionState> {
  await requireAdminSession();
  const id = stringValue(formData, "id").trim();
  if (!id) return { success: false, errors: { id: ["Gallery image is required."] } };

  try {
    await deleteGalleryImageRecord(id);
  } catch (error) {
    console.error("Gallery image deletion failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not delete that image right now. Please refresh and try again." };
  }

  revalidateGallery();
  return { success: true, message: "Gallery image deleted." };
}
