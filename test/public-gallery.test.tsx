import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/gallery", () => ({
  getPublicGalleryImages: vi.fn().mockResolvedValue([
    { id: "gallery-1", imageUrl: "https://images.unsplash.com/photo-1", caption: "Morning pour", category: "coffee", altText: "Latte art", displayOrder: 1, isActive: true },
    { id: "gallery-2", imageUrl: "https://images.unsplash.com/photo-2", caption: "Sunlit tables", category: "interior", altText: "Sunlit tables", displayOrder: 2, isActive: true },
  ]),
}));

import GalleryPage from "@/app/(public)/gallery/page";

describe("public gallery", () => {
  it("renders active database gallery records instead of a hardcoded image list", async () => {
    render(await GalleryPage());

    expect(screen.getByText("Morning pour")).toBeInTheDocument();
    expect(screen.getByText("Sunlit tables")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getAllByRole("img")[0]).toHaveAttribute("src", expect.stringContaining("images.unsplash.com"));
  });
});
