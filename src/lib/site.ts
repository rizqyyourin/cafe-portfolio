export const siteConfig = {
  name: "Kōhi Coffee",
  description:
    "Modern neighborhood specialty coffee, fresh food, and a space made for good conversations.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { href: "/menu", label: "Menu" },
    { href: "/about", label: "About" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export const formatRupiah = (amount: number) => {
  const integerAmount = Math.round(amount);
  const sign = integerAmount < 0 ? "-" : "";
  const digits = Math.abs(integerAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `Rp ${sign}${digits}`;
};

/** Keep legacy Unsplash CMS URLs small enough for the Next image optimizer. */
export const getPublicMenuImageUrl = (imageUrl: string) => {
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.hostname !== "images.unsplash.com") return imageUrl;

    url.searchParams.set("auto", url.searchParams.get("auto") ?? "format");
    url.searchParams.set("fit", url.searchParams.get("fit") ?? "crop");
    url.searchParams.set("w", url.searchParams.get("w") ?? "1200");
    url.searchParams.set("q", url.searchParams.get("q") ?? "85");
    return url.toString();
  } catch {
    return imageUrl;
  }
};
