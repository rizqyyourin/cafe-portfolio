import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a kebab-case slug."),
  description: z.string().trim().min(10).max(500),
  price: z.coerce.number().int().min(0),
  categoryId: z.string().min(1),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  badge: z.string().trim().max(30).optional(),
  isFeatured: z.coerce.boolean().default(false),
  isAvailable: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
