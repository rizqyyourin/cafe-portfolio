import { describe, expect, it } from "vitest";

import { formatRupiah, getPublicMenuImageUrl } from "@/lib/site";

describe("formatRupiah", () => {
  it("uses a stable currency format for SSR and browser rendering", () => {
    expect(formatRupiah(38000)).toBe("Rp 38.000");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1234567)).toBe("Rp 1.234.567");
  });
});

describe("getPublicMenuImageUrl", () => {
  it("adds a lightweight Unsplash transform to legacy seed URLs", () => {
    expect(getPublicMenuImageUrl("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4")).toBe("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85");
  });

  it("preserves already configured transforms and non-Unsplash CMS URLs", () => {
    const configured = "https://images.unsplash.com/photo-1?auto=format&fit=crop&w=1200&q=85";
    const custom = "https://cdn.example.com/menu/item.jpg";

    expect(getPublicMenuImageUrl(configured)).toBe(configured);
    expect(getPublicMenuImageUrl(custom)).toBe(custom);
  });
});
