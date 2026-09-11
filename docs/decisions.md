# Architecture decisions

## Chosen

| Decision | Why |
| --- | --- |
| Next.js App Router + Server Actions | Meets the PRD while keeping form writes close to the UI and data private by default. |
| Turso + Drizzle | Lightweight SQLite ergonomics, typed schema/migrations, and Vercel-friendly deployment. |
| Better Auth | Session-based auth that works with Next.js and Drizzle; public sign-up can be disabled. |
| Integer rupiah pricing | Prevents floating-point rounding errors. |
| One structured settings record | Easy global read path for a single-location cafe MVP. |
| Object storage for media | Keeps database fast and portable; database holds URLs and metadata only. |

## Deferred

| Decision | Reason |
| --- | --- |
| Exact storage provider | Depends on client budget, image volume, and delivery preference. Choose before gallery CMS work. |
| Rate-limit provider | Pick alongside deployment/observability (for example Upstash or Arcjet). |
| Multiple admin roles | Explicitly post-MVP. Start with owner-only session access. |
| Reservation capacity rules | The first version records requests, not table inventory or availability. |
| Online payment and ordering | Explicitly out of scope. |

## Brand defaults

The scaffold uses fictional **Kōhi Coffee** with an editorial, warm, minimal visual direction. All café identity, address, social handles, photos, and contact information are placeholders and must be replaced from client-approved material before launch.
