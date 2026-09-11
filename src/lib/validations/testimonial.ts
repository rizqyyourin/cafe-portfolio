import { z } from "zod";

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name must be at least 2 characters.").max(80, "Customer name must be 80 characters or fewer."),
  content: z.string().trim().min(10, "Guest note must be at least 10 characters.").max(500, "Guest note must be 500 characters or fewer."),
  rating: z.coerce.number().int("Rating must be a whole number.").min(1, "Rating must be at least 1 star.").max(5, "Rating cannot exceed 5 stars."),
  isActive: z.coerce.boolean().default(true),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
