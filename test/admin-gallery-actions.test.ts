import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  insertGalleryImage: vi.fn(),
  updateGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireAdminSession: actionMocks.requireAdminSession }));
vi.mock("@/db/gallery", () => ({
  insertGalleryImage: actionMocks.insertGalleryImage,
  updateGalleryImage: actionMocks.updateGalleryImage,
  deleteGalleryImage: actionMocks.deleteGalleryImage,
}));
vi.mock("next/cache", () => ({ revalidatePath: actionMocks.revalidatePath }));

import { createGalleryImage, deleteGalleryImage, updateGalleryImage } from "@/actions/admin-gallery";

function validGalleryForm() {
  const form = new FormData();
  form.set("imageUrl", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085");
  form.set("caption", "Late morning light");
  form.set("category", "coffee");
  form.set("altText", "A fresh coffee served in a ceramic cup");
  form.set("displayOrder", "6");
  form.set("isActive", "on");
  return form;
}

describe("gallery server actions", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["create", "update"])("resolves a photo share link before %s", async (operation) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('<meta property="og:image" content="https://images.unsplash.com/photo-1556742400-b5b7c5121f99?w=1200&amp;mark=logo">')));
    const form = validGalleryForm();
    form.set("id", "gallery-1");
    form.set("imageUrl", "https://unsplash.com/photos/white-ceramic-cup-A0tNoiSq4mo");
    const result = await (operation === "create" ? createGalleryImage(form) : updateGalleryImage(form));
    expect(result.success).toBe(true);
    const values = { imageUrl: "https://images.unsplash.com/photo-1556742400-b5b7c5121f99" };
    if (operation === "create") expect(actionMocks.insertGalleryImage).toHaveBeenCalledWith(expect.objectContaining(values));
    else expect(actionMocks.updateGalleryImage).toHaveBeenCalledWith("gallery-1", expect.objectContaining(values));
  });

  it("does not save when a photo link cannot be resolved", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const form = validGalleryForm();
    form.set("imageUrl", "https://unsplash.com/photos/missing-photo");
    expect(await createGalleryImage(form)).toMatchObject({ success: false, errors: { imageUrl: expect.any(Array) } });
    expect(actionMocks.insertGalleryImage).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    actionMocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    actionMocks.insertGalleryImage.mockReset().mockResolvedValue("gallery-new");
    actionMocks.updateGalleryImage.mockReset().mockResolvedValue(undefined);
    actionMocks.deleteGalleryImage.mockReset().mockResolvedValue(undefined);
    actionMocks.revalidatePath.mockReset();
  });

  it("creates a validated Unsplash image behind the admin session boundary", async () => {
    const result = await createGalleryImage(validGalleryForm());

    expect(actionMocks.insertGalleryImage).toHaveBeenCalledWith({ imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", caption: "Late morning light", category: "coffee", altText: "A fresh coffee served in a ceramic cup", displayOrder: 6, isActive: true });
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/gallery");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/gallery");
    expect(result).toEqual({ success: true, message: "Gallery image created." });
  });

  it("rejects non-Unsplash URLs and invalid metadata without writing", async () => {
    const form = validGalleryForm();
    form.set("imageUrl", "https://example.com/image.jpg");
    form.set("altText", "x");

    const result = await createGalleryImage(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ imageUrl: expect.any(Array), altText: expect.any(Array) }));
    expect(actionMocks.insertGalleryImage).not.toHaveBeenCalled();
  });

  it("updates an image and persists an unchecked published box as false", async () => {
    const form = validGalleryForm();
    form.set("id", "gallery-1");
    form.delete("isActive");

    const result = await updateGalleryImage(form);

    expect(actionMocks.updateGalleryImage).toHaveBeenCalledWith("gallery-1", expect.objectContaining({ isActive: false, category: "coffee" }));
    expect(result).toEqual({ success: true, message: "Gallery image updated." });
  });

  it("requires an explicit image id for update and delete", async () => {
    expect(await updateGalleryImage(validGalleryForm())).toEqual({ success: false, errors: { id: ["Gallery image is required."] } });
    expect(await deleteGalleryImage(new FormData())).toEqual({ success: false, errors: { id: ["Gallery image is required."] } });
    expect(actionMocks.updateGalleryImage).not.toHaveBeenCalled();
    expect(actionMocks.deleteGalleryImage).not.toHaveBeenCalled();
  });

  it("returns a safe persistence error without exposing provider details", async () => {
    actionMocks.deleteGalleryImage.mockRejectedValueOnce(new Error("storage provider unavailable"));
    const form = new FormData();
    form.set("id", "gallery-1");

    const result = await deleteGalleryImage(form);

    expect(result).toEqual({ success: false, message: "We could not delete that image right now. Please refresh and try again." });
    expect(result.message).not.toContain("storage provider");
  });

  it("does not touch gallery data when authentication fails", async () => {
    actionMocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));

    await expect(deleteGalleryImage(new FormData())).rejects.toThrow("redirect to login");
    expect(actionMocks.deleteGalleryImage).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
