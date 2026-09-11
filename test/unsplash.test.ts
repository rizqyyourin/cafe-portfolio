import { afterEach, expect, it, vi } from "vitest";
import { resolveUnsplashImageUrl } from "@/lib/unsplash";
import { galleryImageSchema } from "@/lib/validations/gallery";

afterEach(() => vi.unstubAllGlobals());

it("accepts a photo page and resolves it to the original image without social overlays", async () => {
  const page = "https://unsplash.com/photos/white-ceramic-cup-A0tNoiSq4mo";
  expect(galleryImageSchema.shape.imageUrl.safeParse(page).success).toBe(true);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('<meta property="og:image" content="https://images.unsplash.com/photo-1556742400-b5b7c5121f99?mark=logo&amp;w=1200">')));
  expect(await resolveUnsplashImageUrl(page)).toBe("https://images.unsplash.com/photo-1556742400-b5b7c5121f99");
});

it("keeps direct image URLs without fetching", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const url = "https://images.unsplash.com/photo-123?w=800";
  expect(await resolveUnsplashImageUrl(url)).toBe(url);
  expect(fetcher).not.toHaveBeenCalled();
});

it("rejects other hosts, credentials and non-photo pages", async () => {
  for (const url of ["https://example.com/photos/foo", "https://unsplash.com.evil.test/photos/foo", "https://user:pass@unsplash.com/photos/foo", "https://unsplash.com/collections/foo"]) {
    expect(galleryImageSchema.shape.imageUrl.safeParse(url).success).toBe(false);
    await expect(resolveUnsplashImageUrl(url)).rejects.toThrow();
  }
});

it("reports unavailable pages and refuses image metadata from another host", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("", { status: 404 })).mockResolvedValueOnce(new Response('<meta property="og:image" content="https://example.com/image.jpg">')));
  await expect(resolveUnsplashImageUrl("https://unsplash.com/photos/foo")).rejects.toThrow();
  await expect(resolveUnsplashImageUrl("https://unsplash.com/photos/foo")).rejects.toThrow();
});
