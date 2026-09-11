"use server";

import { revalidatePath } from "next/cache";

import { deleteTestimonial as deleteTestimonialRecord, insertTestimonial, updateTestimonial as updateTestimonialRecord } from "@/db/testimonials";
import { requireAdminSession } from "@/lib/auth-guard";
import { testimonialSchema } from "@/lib/validations/testimonial";

export type TestimonialActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function testimonialValues(formData: FormData) {
  return {
    customerName: stringValue(formData, "customerName"),
    content: stringValue(formData, "content"),
    rating: stringValue(formData, "rating"),
    isActive: formData.get("isActive") === "on",
  };
}

function revalidateTestimonials() {
  revalidatePath("/admin");
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function createTestimonial(formData: FormData): Promise<TestimonialActionState> {
  await requireAdminSession();
  const parsed = testimonialSchema.safeParse(testimonialValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await insertTestimonial(parsed.data);
  } catch (error) {
    console.error("Testimonial creation failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not save that testimonial right now. Check the details and try again." };
  }

  revalidateTestimonials();
  return { success: true, message: "Testimonial created." };
}

export async function updateTestimonial(formData: FormData): Promise<TestimonialActionState> {
  await requireAdminSession();
  const id = stringValue(formData, "id").trim();
  if (!id) return { success: false, errors: { id: ["Testimonial is required."] } };

  const parsed = testimonialSchema.safeParse(testimonialValues(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateTestimonialRecord(id, parsed.data);
  } catch (error) {
    console.error("Testimonial update failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not update that testimonial right now. Check the details and try again." };
  }

  revalidateTestimonials();
  return { success: true, message: "Testimonial updated." };
}

export async function deleteTestimonial(formData: FormData): Promise<TestimonialActionState> {
  await requireAdminSession();
  const id = stringValue(formData, "id").trim();
  if (!id) return { success: false, errors: { id: ["Testimonial is required."] } };

  try {
    await deleteTestimonialRecord(id);
  } catch (error) {
    console.error("Testimonial deletion failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not delete that testimonial right now. Please refresh and try again." };
  }

  revalidateTestimonials();
  return { success: true, message: "Testimonial deleted." };
}
