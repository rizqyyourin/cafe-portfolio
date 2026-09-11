export function isUnsplashImageInput(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (
      (url.hostname === "images.unsplash.com" && /^\/photo-[\w-]+$/.test(url.pathname)) ||
      (["unsplash.com", "www.unsplash.com"].includes(url.hostname) && /^\/photos\/[\w-]+\/?$/.test(url.pathname))
    );
  } catch {
    return false;
  }
}

/** Resolve photo share links once on save, never during gallery rendering. */
export async function resolveUnsplashImageUrl(value: string): Promise<string> {
  if (!isUnsplashImageInput(value)) throw new Error("Use an Unsplash photo link or image URL.");
  const url = new URL(value);
  if (url.hostname === "images.unsplash.com") return value;
  url.hostname = "unsplash.com";
  url.search = "";
  url.hash = "";
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10000), headers: { Accept: "text/html" } });
  if (!response.ok) throw new Error("Could not load the Unsplash photo.");
  const html = await response.text();
  const meta = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*>/i)?.[0];
  const image = meta?.match(/content=["']([^"']+)["']/i)?.[1];
  if (!image) throw new Error("Could not find the Unsplash image.");
  const imageUrl = new URL(image.replaceAll("&amp;", "&"));
  if (imageUrl.hostname !== "images.unsplash.com" || !isUnsplashImageInput(imageUrl.toString())) throw new Error("Invalid Unsplash image.");
  // The social preview has a logo and dark overlay; use the original photo path.
  return `${imageUrl.origin}${imageUrl.pathname}`;
}
