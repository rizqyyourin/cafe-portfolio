# Architecture

## Product boundaries

```text
Public visitor
  → Next.js public routes (Server Components)
  → read queries / cached cafe content
  → Turso

Reservation form
  → client UX
  → Server Action + Zod validation + reservation repository + rate limiter
  → Turso reservation (PENDING)

Cafe owner
  → Better Auth session
  → protected /admin route group
  → Server Action + authorization + Zod
  → Turso + revalidatePath
```

The public site does not expose a customer account system. The admin group is protected in its server layout; `/auth/login` is the only public internal-auth route, public sign-up is disabled, and successful authentication enters `/admin`.

## Code map

```text
src/app/(public)      public marketing and conversion routes
src/app/admin         login and protected CMS routes
src/actions           mutation-only server actions
src/components        shared visual and interactive components
src/db                Turso client and Drizzle schema
src/lib               auth, validation, constants, utilities
scripts               one-off developer commands (seed, later admin provision)
docs                  implementation and handoff documentation
```

## Data access rules

- Keep database calls in server-only repositories/query modules once list/detail views are added; do not let client components import `src/db`.
- Public queries select only active categories, active gallery entries, active testimonials, and available menu items as appropriate.
- Mutations validate on the server, authenticate/authorize first when admin-only, then revalidate affected public and CMS paths.
- The protected dashboard reads its counters and reservation queues through `src/db/dashboard.ts`; its Add Menu Item and reservation review controls call authenticated actions in `src/actions/admin-dashboard.ts`.
- The Menu CMS route reads joined active-category metadata through `src/db/menu.ts`; create, update, and delete modals call authenticated actions in `src/actions/admin-menu.ts`, which revalidate the CMS, dashboard, and public menu paths.
- The Categories CMS route reads all categories with menu-item usage counts through `src/db/categories.ts`; its authenticated actions in `src/actions/admin-categories.ts` prevent deletion of categories that still contain menu items and revalidate dependent menu paths.
- The Gallery CMS route reads URL-based images through `src/db/gallery.ts`; its actions in `src/actions/admin-gallery.ts` accept only HTTPS Unsplash URLs, preserve alt text and publish state, and revalidate the CMS and public gallery paths.
- The Reservations CMS route reads dynamic request snapshots through `src/db/reservations.ts`; its actions in `src/actions/admin-reservations.ts` enforce admin access, validate status input, allow only the documented state transitions, and revalidate the private list after updates. Date filters use a server-provided Jakarta window so client filtering stays hydration-safe.
- The Settings CMS route reads the singleton `cafe_settings` row through `src/db/settings.ts`; its action in `src/actions/admin-settings.ts` validates the complete snapshot, atomically upserts the default row, normalizes blank optional links to null, and revalidates all public consumers. The public layout, home, contact page, reservation hours, footer, metadata, and local-business JSON-LD read the same settings fallback.
- The Testimonials CMS route reads all guest notes and a published count through `src/db/testimonials.ts`; its actions in `src/actions/admin-testimonials.ts` validate one-to-five ratings, enforce admin access, preserve hidden notes, and revalidate the CMS, dashboard, and home page. The public home uses `getPublicTestimonials()` so hidden notes never render publicly.
- Store monetary values as integer IDR. Format only at the presentation edge with `formatRupiah`.

## Caching

Public content can use Next.js cache/revalidation after the query layer exists. Use tag- or path-based revalidation immediately after a CMS mutation. Reservation and admin data must remain dynamic and private. Do not cache a page that includes a user session.

## Security baseline

- Better Auth owns hashed passwords and signed sessions; public registration is disabled.
- The admin layout performs the initial server-side route check. Every admin mutation must repeat session/authorization validation.
- Zod is the final validation boundary. Browser validation is only a convenience.
- Reservation requests need rate limiting, bot protection, and audit-friendly error logging before production.
- Uploads need an allow-list of content types, a server-enforced size limit, generated storage keys, and no user-controlled file path.
- Keep database, auth, and storage credentials in server-only environment variables.
