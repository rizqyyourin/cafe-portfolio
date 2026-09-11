import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  insertTestimonial: vi.fn(),
  updateTestimonial: vi.fn(),
  deleteTestimonial: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireAdminSession: actionMocks.requireAdminSession }));
vi.mock("@/db/testimonials", () => ({
  insertTestimonial: actionMocks.insertTestimonial,
  updateTestimonial: actionMocks.updateTestimonial,
  deleteTestimonial: actionMocks.deleteTestimonial,
}));
vi.mock("next/cache", () => ({ revalidatePath: actionMocks.revalidatePath }));

import { createTestimonial, deleteTestimonial, updateTestimonial } from "@/actions/admin-testimonials";

function validTestimonialForm() {
  const form = new FormData();
  form.set("customerName", "Clara Wibowo");
  form.set("content", "The truffle scramble alone is worth crossing the city for.");
  form.set("rating", "4");
  form.set("isActive", "on");
  return form;
}

describe("testimonial server actions", () => {
  beforeEach(() => {
    actionMocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    actionMocks.insertTestimonial.mockReset().mockResolvedValue("testimonial-new");
    actionMocks.updateTestimonial.mockReset().mockResolvedValue(undefined);
    actionMocks.deleteTestimonial.mockReset().mockResolvedValue(undefined);
    actionMocks.revalidatePath.mockReset();
  });

  it("creates a validated published testimonial behind the admin session boundary", async () => {
    const result = await createTestimonial(validTestimonialForm());

    expect(actionMocks.insertTestimonial).toHaveBeenCalledWith({ customerName: "Clara Wibowo", content: "The truffle scramble alone is worth crossing the city for.", rating: 4, isActive: true });
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/testimonials");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: true, message: "Testimonial created." });
  });

  it("rejects ratings outside one through five without writing", async () => {
    const form = validTestimonialForm();
    form.set("rating", "6");

    const result = await createTestimonial(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ rating: expect.any(Array) }));
    expect(actionMocks.insertTestimonial).not.toHaveBeenCalled();
  });

  it("updates a testimonial and persists an unchecked published box as false", async () => {
    const form = validTestimonialForm();
    form.set("id", "testimonial-1");
    form.delete("isActive");

    const result = await updateTestimonial(form);

    expect(actionMocks.updateTestimonial).toHaveBeenCalledWith("testimonial-1", expect.objectContaining({ rating: 4, isActive: false }));
    expect(result).toEqual({ success: true, message: "Testimonial updated." });
  });

  it("requires an explicit testimonial id for update and delete", async () => {
    expect(await updateTestimonial(validTestimonialForm())).toEqual({ success: false, errors: { id: ["Testimonial is required."] } });
    expect(await deleteTestimonial(new FormData())).toEqual({ success: false, errors: { id: ["Testimonial is required."] } });
    expect(actionMocks.updateTestimonial).not.toHaveBeenCalled();
    expect(actionMocks.deleteTestimonial).not.toHaveBeenCalled();
  });

  it("returns a safe persistence error without exposing database details", async () => {
    actionMocks.deleteTestimonial.mockRejectedValueOnce(new Error("database connection string"));
    const form = new FormData();
    form.set("id", "testimonial-1");

    const result = await deleteTestimonial(form);

    expect(result).toEqual({ success: false, message: "We could not delete that testimonial right now. Please refresh and try again." });
    expect(result.message).not.toContain("connection string");
  });

  it("does not touch testimonial data when authentication fails", async () => {
    actionMocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));

    await expect(deleteTestimonial(new FormData())).rejects.toThrow("redirect to login");
    expect(actionMocks.deleteTestimonial).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
