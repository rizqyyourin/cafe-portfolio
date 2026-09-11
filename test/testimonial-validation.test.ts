import { describe, expect, it } from "vitest";

import { testimonialSchema } from "@/lib/validations/testimonial";

describe("testimonial validation", () => {
  it("trims valid content and defaults new testimonials to published", () => {
    expect(testimonialSchema.parse({ customerName: "  Nadia Ramadhani  ", content: "  A thoughtful place to return to.  ", rating: "5" })).toEqual({ customerName: "Nadia Ramadhani", content: "A thoughtful place to return to.", rating: 5, isActive: true });
  });

  it("limits ratings to whole numbers from one through five", () => {
    expect(testimonialSchema.safeParse({ customerName: "Nadia", content: "A lovely place to return to.", rating: 0 }).success).toBe(false);
    expect(testimonialSchema.safeParse({ customerName: "Nadia", content: "A lovely place to return to.", rating: 6 }).success).toBe(false);
    expect(testimonialSchema.safeParse({ customerName: "Nadia", content: "A lovely place to return to.", rating: 4.5 }).success).toBe(false);
  });

  it("requires useful customer names and guest notes", () => {
    const result = testimonialSchema.safeParse({ customerName: "x", content: "short", rating: 5 });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors).toEqual(expect.objectContaining({ customerName: expect.any(Array), content: expect.any(Array) }));
  });
});
