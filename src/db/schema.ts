import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
};

/** Better Auth's core user table for invited internal team accounts. */
export const user = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const session = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const category = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const menuItem = sqliteTable(
  "menu_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull().references(() => category.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    /** Stored as whole Indonesian rupiah, never a floating point amount. */
    price: integer("price").notNull(),
    imageUrl: text("image_url"),
    badge: text("badge"),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("menu_items_slug_unique").on(table.slug),
    index("menu_items_category_id_idx").on(table.categoryId),
    index("menu_items_featured_idx").on(table.isFeatured),
  ],
);

export const galleryImage = sqliteTable(
  "gallery_images",
  {
    id: text("id").primaryKey(),
    imageUrl: text("image_url").notNull(),
    caption: text("caption").notNull(),
    category: text("category").notNull(),
    altText: text("alt_text").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [index("gallery_images_active_idx").on(table.isActive)],
);

export const reservationStatus = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
export type ReservationStatus = (typeof reservationStatus)[number];

export const reservation = sqliteTable(
  "reservations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    reservationDate: text("reservation_date").notNull(),
    reservationTime: text("reservation_time").notNull(),
    guestCount: integer("guest_count").notNull(),
    specialRequest: text("special_request"),
    status: text("status", { enum: reservationStatus }).notNull().default("PENDING"),
    ...timestamps,
  },
  (table) => [
    index("reservations_status_idx").on(table.status),
    index("reservations_date_idx").on(table.reservationDate),
  ],
);

export const testimonial = sqliteTable(
  "testimonials",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    content: text("content").notNull(),
    rating: integer("rating").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [index("testimonials_active_idx").on(table.isActive)],
);

/** One row is maintained by the CMS and read by every public page. */
export const cafeSetting = sqliteTable("cafe_settings", {
  id: text("id").primaryKey(),
  cafeName: text("cafe_name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  instagram: text("instagram"),
  threads: text("threads"),
  twitter: text("twitter"),
  tiktok: text("tiktok"),
  facebook: text("facebook"),
  mapsUrl: text("maps_url").notNull(),
  openingHours: text("opening_hours", { mode: "json" }).$type<Record<string, string>>().notNull(),
  ...timestamps,
});

export const categoryRelations = relations(category, ({ many }) => ({ menuItems: many(menuItem) }));
export const menuItemRelations = relations(menuItem, ({ one }) => ({
  category: one(category, { fields: [menuItem.categoryId], references: [category.id] }),
}));
export const userRelations = relations(user, ({ many }) => ({ sessions: many(session), accounts: many(account) }));
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));
