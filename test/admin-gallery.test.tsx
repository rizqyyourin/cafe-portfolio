import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigationMocks }));

import { GalleryView, type GalleryAction, type GalleryPageData } from "@/components/admin/gallery-view";

const galleryData: GalleryPageData = {
  categories: ["coffee", "interior", "food", "events"],
  images: [
    { id: "gallery-1", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", caption: "Morning pour", category: "coffee", altText: "Latte art in a dark coffee cup", displayOrder: 1, isActive: true },
    { id: "gallery-2", imageUrl: "https://images.unsplash.com/photo-1511081692775-05d0f180a065", caption: "Sunlit tables", category: "interior", altText: "Sunlit cafe interior with wooden tables", displayOrder: 2, isActive: true },
    { id: "gallery-3", imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", caption: "Sunday brunch", category: "food", altText: "Avocado toast served on a blue plate", displayOrder: 3, isActive: true },
    { id: "gallery-4", imageUrl: "https://images.unsplash.com/photo-1498804103079-a6351b050096", caption: "The bar", category: "interior", altText: "A barista pouring latte art", displayOrder: 4, isActive: true },
    { id: "gallery-5", imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb", caption: "Private event", category: "events", altText: "A warm cafe event table", displayOrder: 5, isActive: false },
  ],
};

function renderGallery(overrides: Partial<GalleryPageData> = {}, actions?: {
  createGalleryImageAction?: GalleryAction;
  updateGalleryImageAction?: GalleryAction;
  deleteGalleryImageAction?: GalleryAction;
}) {
  const createGalleryImageAction = actions?.createGalleryImageAction ?? vi.fn().mockResolvedValue({ success: true, message: "Gallery image created." });
  const updateGalleryImageAction = actions?.updateGalleryImageAction ?? vi.fn().mockResolvedValue({ success: true, message: "Gallery image updated." });
  const deleteGalleryImageAction = actions?.deleteGalleryImageAction ?? vi.fn().mockResolvedValue({ success: true, message: "Gallery image deleted." });

  return {
    createGalleryImageAction,
    updateGalleryImageAction,
    deleteGalleryImageAction,
    ...render(<GalleryView createGalleryImageAction={createGalleryImageAction} data={{ ...galleryData, ...overrides }} deleteGalleryImageAction={deleteGalleryImageAction} updateGalleryImageAction={updateGalleryImageAction} />),
  };
}

async function fillGalleryForm(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("Image URL"), "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085");
  await user.type(within(dialog).getByLabelText("Caption"), "Late morning light");
  await user.selectOptions(within(dialog).getByLabelText("Category"), "coffee");
  await user.type(within(dialog).getByLabelText("Alt text"), "A fresh coffee served in a ceramic cup");
  await user.clear(within(dialog).getByLabelText("Display order"));
  await user.type(within(dialog).getByLabelText("Display order"), "6");
}

describe("gallery module", () => {
  beforeEach(() => navigationMocks.refresh.mockReset());

  it("renders the designed image grid with published counts and Unsplash metadata", () => {
    renderGallery();

    expect(screen.getByRole("heading", { name: "Gallery" })).toBeInTheDocument();
    expect(screen.getByText("4 published images across 4 moments")).toBeInTheDocument();
    expect(screen.getByText("Morning pour")).toBeInTheDocument();
    expect(screen.getAllByText("Coffee").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Latte art in a dark coffee cup" })).toHaveAttribute("src", expect.stringContaining("images.unsplash.com"));
    expect(screen.getByText("Private event")).toBeInTheDocument();
    expect(screen.getByText(/Draft/)).toBeInTheDocument();
  });

  it("filters by category and exposes a clear empty state", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("button", { name: "Interior" }));
    expect(screen.getByText("Sunlit tables")).toBeInTheDocument();
    expect(screen.queryByText("Morning pour")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(screen.getByText("Private event")).toBeInTheDocument();
    expect(screen.queryByText("Sunlit tables")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All images" }));
    expect(screen.getByText("Morning pour")).toBeInTheDocument();
  });

  it("opens create, blocks empty required input, and closes with Escape", async () => {
    const user = userEvent.setup();
    const { createGalleryImageAction } = renderGallery();

    await user.click(screen.getByRole("button", { name: /upload image/i }));
    const dialog = screen.getByRole("dialog", { name: "Add gallery image" });
    expect(within(dialog).getByLabelText("Image URL")).toBeRequired();
    await user.click(within(dialog).getByRole("button", { name: "Save image" }));
    expect(createGalleryImageAction).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add gallery image" })).not.toBeInTheDocument();
  });

  it("creates an image, refreshes, and prevents duplicate submit while pending", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const createGalleryImageAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderGallery({}, { createGalleryImageAction });

    await user.click(screen.getByRole("button", { name: /upload image/i }));
    const dialog = screen.getByRole("dialog", { name: "Add gallery image" });
    await fillGalleryForm(dialog, user);
    const submit = within(dialog).getByRole("button", { name: "Save image" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(createGalleryImageAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Gallery image created." });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add gallery image" })).not.toBeInTheDocument());
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps create open and shows server validation errors", async () => {
    const user = userEvent.setup();
    const createGalleryImageAction = vi.fn().mockResolvedValue({ success: false, message: "Use an Unsplash image URL.", errors: { imageUrl: ["Use an Unsplash image URL."] } });
    renderGallery({}, { createGalleryImageAction });

    await user.click(screen.getByRole("button", { name: /upload image/i }));
    const dialog = screen.getByRole("dialog", { name: "Add gallery image" });
    await fillGalleryForm(dialog, user);
    await user.click(within(dialog).getByRole("button", { name: "Save image" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Use an Unsplash image URL.");
    expect(screen.getByRole("dialog", { name: "Add gallery image" })).toBeInTheDocument();
  });

  it("prefills edit, toggles published state, and refreshes after success", async () => {
    const user = userEvent.setup();
    const updateGalleryImageAction = vi.fn().mockResolvedValue({ success: true, message: "Gallery image updated." });
    renderGallery({}, { updateGalleryImageAction });

    await user.click(screen.getByRole("button", { name: "Edit Morning pour" }));
    const dialog = screen.getByRole("dialog", { name: "Edit gallery image" });
    expect(within(dialog).getByLabelText("Caption")).toHaveValue("Morning pour");
    await user.click(within(dialog).getByLabelText("Published"));
    await user.click(within(dialog).getByRole("button", { name: "Save image" }));

    await waitFor(() => expect(updateGalleryImageAction).toHaveBeenCalledOnce());
    expect(updateGalleryImageAction.mock.calls[0]?.[0].get("id")).toBe("gallery-1");
    expect(updateGalleryImageAction.mock.calls[0]?.[0].get("isActive")).toBe(null);
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("requires explicit delete confirmation and deletes an image after confirmation", async () => {
    const user = userEvent.setup();
    const deleteGalleryImageAction = vi.fn().mockResolvedValue({ success: true, message: "Gallery image deleted." });
    renderGallery({}, { deleteGalleryImageAction });

    await user.click(screen.getByRole("button", { name: "Edit Morning pour" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit gallery image" })).getByRole("button", { name: "Delete image" }));
    const confirm = screen.getByRole("dialog", { name: "Delete gallery image" });
    expect(confirm).toHaveTextContent("Morning pour");
    expect(deleteGalleryImageAction).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: "Delete image" }));
    await waitFor(() => expect(deleteGalleryImageAction).toHaveBeenCalledOnce());
    expect(deleteGalleryImageAction.mock.calls[0]?.[0].get("id")).toBe("gallery-1");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps delete open after a persistence failure and resets pending", async () => {
    const user = userEvent.setup();
    const deleteGalleryImageAction = vi.fn().mockResolvedValue({ success: false, message: "We could not delete that image right now." });
    renderGallery({}, { deleteGalleryImageAction });

    await user.click(screen.getByRole("button", { name: "Edit Morning pour" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit gallery image" })).getByRole("button", { name: "Delete image" }));
    const confirm = screen.getByRole("dialog", { name: "Delete gallery image" });
    await user.click(within(confirm).getByRole("button", { name: "Delete image" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not delete that image right now.");
    expect(within(screen.getByRole("dialog", { name: "Delete gallery image" })).getByRole("button", { name: "Delete image" })).not.toBeDisabled();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it("shows a useful empty state when there are no images", () => {
    renderGallery({ images: [], categories: [] });

    expect(screen.getByText("No gallery images yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument();
  });
});
