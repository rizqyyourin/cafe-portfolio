import { z } from "zod";
import { isUnsplashImageInput } from "@/lib/unsplash";

const unsplashUrl = z.string().trim().url("Enter a valid image URL.").refine(isUnsplashImageInput, "Use an Unsplash photo link or image URL.");

export const galleryImageSchema = z.object({
  imageUrl: unsplashUrl,
  caption: z.string().trim().min(2, "Caption must be at least 2 characters.").max(120, "Caption must be 120 characters or fewer."),
  category: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase category slug.").max(30, "Category must be 30 characters or fewer."),
  altText: z.string().trim().min(5, "Alt text must be at least 5 characters.").max(180, "Alt text must be 180 characters or fewer."),
  displayOrder: z.coerce.number().int("Display order must be a whole number.").min(0, "Display order cannot be negative."),
  isActive: z.coerce.boolean().default(true),
});

export type GalleryImageInput = z.infer<typeof galleryImageSchema>;
