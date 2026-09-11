# Data model

The source of truth is [src/db/schema.ts](../src/db/schema.ts). It uses SQLite/libSQL types and maps cleanly to Turso.

| Table | Responsibility | Critical rule |
| --- | --- | --- |
| `users`, `sessions`, `accounts`, `verifications` | Better Auth user/session records | Do not manually hash or query passwords outside Better Auth |
| `categories` | Menu grouping and order | A category with menu items cannot be casually deleted |
| `menu_items` | Public menu content | `price` is integer IDR; unavailable is not deletion |
| `gallery_images` | URL-based visual gallery | Store alt text and metadata, not file binaries |
| `reservations` | Customer requests | New records start as `PENDING` |
| `testimonials` | Owner-curated social proof | Public pages select only active rows |
| `cafe_settings` | One global cafe profile | Maintain exactly one row with id `default` |

## Relationships

```text
categories (1) ─────< menu_items (*)
users (1) ──────────< sessions (*)
users (1) ──────────< accounts (*)
```

Reservations, gallery images, testimonials, and cafe settings are independent in the MVP. This keeps admin operations simple and matches the PRD.

## Reservation state transitions

```text
PENDING ──→ CONFIRMED ──→ COMPLETED
   └─────→ CANCELLED
```

The reservation management action must reject any other transition. Record who made the change if multi-admin audit logging is added after MVP.

## Seed content

`pnpm db:seed` contains six categories, twenty menu items, ten Unsplash gallery records, four testimonials, five reservations, and one cafe settings row. The default menu covers every category with published items and can be rerun without overwriting existing CMS content; it only fills missing default image URLs. Unsplash is development/demo media only; replace these URLs with licensed, client-owned media before deployment.
