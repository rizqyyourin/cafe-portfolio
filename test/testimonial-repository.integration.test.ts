import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deleteTestimonial, getPublicTestimonials, getTestimonialsPageData, insertTestimonial, TestimonialNotFoundError, updateTestimonial } from "@/db/testimonials";
import * as schema from "@/db/schema";
import { testimonial } from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-testimonials-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute(`CREATE TABLE testimonials (id TEXT PRIMARY KEY NOT NULL, customer_name TEXT NOT NULL, content TEXT NOT NULL, rating INTEGER NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  await client.execute(`INSERT INTO testimonials VALUES ('testimonial-1', 'Nadia Ramadhani', 'The kind of place you find once, then quietly make part of your week.', 5, 1, 100, 100), ('testimonial-2', 'Dimas Putra', 'Coffee that makes a slow Sunday even better.', 5, 0, 200, 200)`);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

const values = {
  customerName: "Clara Wibowo",
  content: "The truffle scramble alone is worth crossing the city for.",
  rating: 4,
  isActive: true,
} as const;

describe("testimonial repository", () => {
  it("returns all admin records and counts only published records", async () => {
    const result = await getTestimonialsPageData(testDb);

    expect(result.testimonials).toHaveLength(2);
    expect(result.publishedCount).toBe(1);
    expect(result.testimonials[1]).toMatchObject({ customerName: "Dimas Putra", isActive: false });
  });

  it("returns published records only for the public website", async () => {
    const result = await getPublicTestimonials(testDb);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "testimonial-1", isActive: true });
  });

  it("creates, updates, and deletes by id", async () => {
    const id = await insertTestimonial(values, testDb);
    await updateTestimonial(id, { ...values, content: "Updated guest note.", isActive: false }, testDb);
    expect((await testDb.select({ content: testimonial.content, isActive: testimonial.isActive }).from(testimonial).where(eq(testimonial.id, id)))[0]).toEqual({ content: "Updated guest note.", isActive: false });

    await deleteTestimonial(id, testDb);
    expect(await testDb.select({ id: testimonial.id }).from(testimonial).where(eq(testimonial.id, id))).toEqual([]);
    await expect(deleteTestimonial("missing-testimonial", testDb)).rejects.toBeInstanceOf(TestimonialNotFoundError);
  });
});
