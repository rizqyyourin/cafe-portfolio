import { describe, expect, it } from "vitest";

import { defaultMenuCategories, defaultMenuImageUrls, defaultMenuItems } from "@/db/default-menu";

describe("default menu seed", () => {
  it("provides at least one published item with a default image for every menu category", () => {
    const itemCounts = new Map<string, number>();

    for (const item of defaultMenuItems) {
      itemCounts.set(item.categorySlug, (itemCounts.get(item.categorySlug) ?? 0) + 1);
    }

    expect(defaultMenuCategories.length).toBeGreaterThanOrEqual(1);
    expect(defaultMenuCategories.every((category) => (itemCounts.get(category.slug) ?? 0) >= 1)).toBe(true);
    expect(defaultMenuItems.every((item) => item.isAvailable)).toBe(true);
    expect(defaultMenuImageUrls.length).toBeGreaterThanOrEqual(defaultMenuCategories.length);
  });
});
