import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const publicMocks = vi.hoisted(() => ({
  getPublicCafeSettings: vi.fn(),
  getPublicFeaturedMenuItems: vi.fn(),
  getPublicTestimonials: vi.fn(),
}));

vi.mock("@/db/settings", () => ({
  getPublicCafeSettings: publicMocks.getPublicCafeSettings,
}));

vi.mock("@/db/menu", () => ({
  getPublicFeaturedMenuItems: publicMocks.getPublicFeaturedMenuItems,
}));

vi.mock("@/db/testimonials", () => ({
  getPublicTestimonials: publicMocks.getPublicTestimonials,
}));

import HomePage from "@/app/(public)/page";

const settings = {
    cafeName: "Kōhi Coffee",
    tagline: "Coffee worth slowing down for.",
    description: "A modern neighbourhood specialty coffee shop in Kemang, Jakarta.",
    logoUrl: null,
    address: "Jl. Kemang Raya No. 28",
    phone: "+62 21 5550 0188",
    whatsapp: "628111111111",
    email: "hello@kohicoffee.example",
    instagram: null,
    tiktok: null,
    facebook: null,
    mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
    mapsEmbedUrl: null,
    openingHours: { Monday: "08:00 - 22:00" },
};

describe("public testimonial", () => {
  beforeEach(() => {
    publicMocks.getPublicCafeSettings.mockReset().mockResolvedValue(settings);
    publicMocks.getPublicFeaturedMenuItems.mockReset().mockResolvedValue([]);
    publicMocks.getPublicTestimonials.mockReset().mockResolvedValue([{ id: "testimonial-1", customerName: "Nadia Ramadhani", content: "A guest note from the database.", rating: 5, isActive: true }]);
  });

  it("renders featured menu items from the database on the landing page", async () => {
    publicMocks.getPublicFeaturedMenuItems.mockResolvedValueOnce([{
      id: "menu-1",
      categoryId: "category-coffee",
      categoryName: "Coffee",
      name: "Kōhi Latte",
      slug: "kohi-latte",
      description: "A silky house latte from the database.",
      price: 38000,
      imageUrl: null,
      badge: "Best Seller",
      isFeatured: true,
      isAvailable: true,
      displayOrder: 1,
    }]);

    render(await HomePage());

    expect(publicMocks.getPublicFeaturedMenuItems).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Kōhi Latte" })).toBeInTheDocument();
    expect(screen.getByText("A silky house latte from the database.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cappuccino" })).not.toBeInTheDocument();
  });

  it("renders the active testimonial from the database", async () => {
    render(await HomePage());

    expect(screen.getByText(/A guest note from the database\./)).toBeInTheDocument();
    expect(screen.getByText("— Nadia Ramadhani")).toBeInTheDocument();
  });

  it("renders a clear fallback when no public testimonial is available", async () => {
    publicMocks.getPublicTestimonials.mockResolvedValueOnce([]);

    render(await HomePage());

    expect(screen.getByText("More guest notes coming soon.")).toBeInTheDocument();
    expect(screen.queryByText(/The kind of place you find once/)).not.toBeInTheDocument();
  });
});
