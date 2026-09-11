import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const publicMenuMocks = vi.hoisted(() => ({
  getPublicMenuPageData: vi.fn(),
}));

vi.mock("@/db/menu", () => ({
  getPublicMenuPageData: publicMenuMocks.getPublicMenuPageData,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => <span aria-label={alt ?? ""} data-src={src} role="img" />,
}));

import MenuPage from "@/app/(public)/menu/page";

const menuPageData = {
  categories: [
    { id: "category-coffee", name: "Coffee" },
    { id: "category-brunch", name: "Brunch" },
  ],
  items: [
    {
      id: "menu-cms-latte",
      categoryId: "category-coffee",
      categoryName: "Coffee",
      name: "Kōhi Latte",
      slug: "kohi-latte",
      description: "A silky house latte from the CMS.",
      price: 38000,
      imageUrl: "https://images.unsplash.com/photo-latte",
      badge: "Best Seller",
      isFeatured: true,
      isAvailable: true,
      displayOrder: 1,
    },
    {
      id: "menu-cms-toast",
      categoryId: "category-brunch",
      categoryName: "Brunch",
      name: "Miso Butter Toast",
      slug: "miso-butter-toast",
      description: "Sourdough, cultured butter, and honey.",
      price: 48000,
      imageUrl: null,
      badge: null,
      isFeatured: false,
      isAvailable: true,
      displayOrder: 2,
    },
  ],
} as const;

describe("public menu page", () => {
  beforeEach(() => {
    publicMenuMocks.getPublicMenuPageData.mockReset().mockResolvedValue(menuPageData);
  });

  it("renders menu items and category filters from CMS data", async () => {
    render(await MenuPage());

    expect(publicMenuMocks.getPublicMenuPageData).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Kōhi Latte" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Miso Butter Toast" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Coffee" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Brunch" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cappuccino" })).not.toBeInTheDocument();
  });

  it("keeps sold-out items visible with a badge, including in category filters", async () => {
    const user = userEvent.setup();
    publicMenuMocks.getPublicMenuPageData.mockResolvedValue({
      ...menuPageData,
      items: menuPageData.items.map((item) => ({ ...item, isAvailable: item.categoryId !== "category-brunch" })),
    });
    render(await MenuPage());

    expect(screen.getByRole("heading", { name: "Miso Butter Toast" })).toBeInTheDocument();
    expect(screen.getAllByText("Sold out")).toHaveLength(1);
    await user.click(screen.getByRole("tab", { name: "Brunch" }));
    expect(screen.getByRole("heading", { name: "Miso Butter Toast" })).toBeInTheDocument();
    expect(screen.getByText("Sold out")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Coffee" }));
    expect(screen.queryByText("Sold out")).not.toBeInTheDocument();
  });

  it("filters CMS menu items using their database category ids", async () => {
    const user = userEvent.setup();
    render(await MenuPage());

    await user.click(screen.getByRole("tab", { name: "Brunch" }));

    expect(screen.getByRole("heading", { name: "Miso Butter Toast" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Kōhi Latte" })).not.toBeInTheDocument();
  });
});
