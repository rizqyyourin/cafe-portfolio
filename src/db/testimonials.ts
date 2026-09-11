import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import type { TestimonialInput } from "@/lib/validations/testimonial";

import { testimonial } from "./schema";

type TestimonialDatabase = typeof db;

export type AdminTestimonial = {
  id: string;
  customerName: string;
  content: string;
  rating: number;
  isActive: boolean;
};

export class TestimonialNotFoundError extends Error {
  constructor() {
    super("Testimonial not found.");
    this.name = "TestimonialNotFoundError";
  }
}

const testimonialColumns = {
  id: testimonial.id,
  customerName: testimonial.customerName,
  content: testimonial.content,
  rating: testimonial.rating,
  isActive: testimonial.isActive,
};

export async function getTestimonialsPageData(database: TestimonialDatabase = db) {
  const testimonials = await database.select(testimonialColumns).from(testimonial).orderBy(asc(testimonial.createdAt), asc(testimonial.customerName));
  return { testimonials, publishedCount: testimonials.filter((item) => item.isActive).length } satisfies { testimonials: AdminTestimonial[]; publishedCount: number };
}

export async function getPublicTestimonials(database: TestimonialDatabase = db) {
  return database.select(testimonialColumns).from(testimonial).where(eq(testimonial.isActive, true)).orderBy(asc(testimonial.createdAt), asc(testimonial.customerName));
}

export async function insertTestimonial(values: TestimonialInput, database: TestimonialDatabase = db) {
  const id = randomUUID();
  await database.insert(testimonial).values({ id, ...values });
  return id;
}

export async function updateTestimonial(id: string, values: TestimonialInput, database: TestimonialDatabase = db) {
  const existing = await database.select({ id: testimonial.id }).from(testimonial).where(eq(testimonial.id, id)).limit(1);
  if (!existing[0]) throw new TestimonialNotFoundError();

  await database.update(testimonial).set({ ...values, updatedAt: new Date() }).where(eq(testimonial.id, id));
}

export async function deleteTestimonial(id: string, database: TestimonialDatabase = db) {
  const existing = await database.select({ id: testimonial.id }).from(testimonial).where(eq(testimonial.id, id)).limit(1);
  if (!existing[0]) throw new TestimonialNotFoundError();

  await database.delete(testimonial).where(eq(testimonial.id, id));
}
