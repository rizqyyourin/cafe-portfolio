# Path to PRD-complete MVP

## 1. Database and read model

- Generate and apply the initial Drizzle migration.
- Add server-only query modules for settings, public menu, gallery, testimonials, dashboard counters, and reservations. (Settings, dashboard counters, active categories, recent reservations, and pending queue are complete.)
- Replace visual placeholders with real empty/loading/error states driven by query outcomes. (Dashboard, Menu, Categories, Gallery, and Reservations loading/data failure states, plus empty collections, are covered.)

## 2. Authentication and authorization

- Add an authenticated admin-only user provisioning flow for additional internal accounts.
- Test login, logout, session expiry, and direct deep-link redirects.
- Put `requireAdminSession()` at the start of every admin Server Action.

## 3. Public content

- Render the home features, all menu categories, gallery, testimonials, contact data, and opening hours from database queries. (Public contact, footer, reservation hours, metadata, and structured data now consume the settings row.)
- Add a responsive client-side menu filter only where server rendering alone cannot meet the interaction.
- Use client-approved, optimized image sources and improve the placeholder structured data with real address, coordinates, and social links.

## 4. CMS actions

- Dashboard module: create menu item and PENDING → CONFIRMED/CANCELLED reservation review are complete, including modal, server validation, authorization, revalidation, success/error/pending feedback, and transition guards.
- Menu module: list, search, active-category/availability filters, display-order sort, five-item pagination, create/edit/delete modals, server validation, authorization, revalidation, and success/error/pending/destructive states are complete. Category CRUD remains the next dependency for broader menu management.
- Categories module: list active/inactive records with display order and menu-item counts, create/edit/toggle active, sort, guarded delete confirmation, server validation, authorization, revalidation, and loading/error/empty/pending states are complete.
- Gallery module: Unsplash-only URL-based image CRUD, category filters, publish/unpublish, accessible alt text, display order, public gallery query, server validation, authorization, revalidation, and loading/error/empty/pending/destructive states are complete. Replace demo Unsplash URLs with licensed client-owned media before deployment.
- Reservations module: real request list/detail, database-backed ten-item infinite-scroll pagination, status and Jakarta today/week filters, WhatsApp links, PENDING → CONFIRMED/CANCELLED, CONFIRMED → COMPLETED/CANCELLED, and CANCELLED → PENDING transitions, server authorization/validation, revalidation, loading/error/empty/pending feedback, and stale-transition guards are complete.
- Settings module: singleton public cafe settings, four-tab editor, atomic upsert, server validation, authorization, public-page revalidation, empty/loading/error/pending/success feedback, and public consumer wiring are complete.
- Testimonials module: guest note list, create/edit/delete modals, one-to-five rating validation, publish/hidden state, active-only public query, authorization, revalidation, loading/error/empty/pending/destructive states, and home-page consumer are complete.
- Add reservation rate limiting and bot protection before production.
- Give every action pending, success, error, and destructive confirmation feedback.

## 5. Production hardening

- Add rate limiting and bot protection to reservations.
- Add content-type/size checks and error handling to uploads.
- Add tests for validators, reservation state transitions, auth redirects, critical mutations, and responsive navigation.
- Configure image remote patterns only for the selected storage provider.
- Verify metadata, canonical URL, sitemap, robots, local-business JSON-LD, accessibility, mobile layout, and Vercel deployment.

## Definition of done checklist

The PRD MVP is done only after each public route uses production data, the owner can complete every stated CMS workflow with a protected session, every write has server validation and user feedback, images persist in external storage, and the production URL has been verified on mobile and desktop.
