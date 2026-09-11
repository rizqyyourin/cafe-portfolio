import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(80, "Category name must be 80 characters or fewer."),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a kebab-case slug."),
  displayOrder: z.coerce.number().int("Display order must be a whole number.").min(0, "Display order cannot be negative."),
  isActive: z.coerce.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
