# Local setup

## Prerequisites

- Node.js 20.9 or later (Node 22 LTS recommended)
- A Turso database and auth token for a shared environment, or `file:local.db` for local-only work
- A long random Better Auth secret

## Environment

Copy `.env.example` to `.env.local` and set the values. `BETTER_AUTH_SECRET` must be unique per environment and must never be committed. For a local SQLite run, set `TURSO_DATABASE_URL=file:local.db`; omit the auth token.

`NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` should be `http://localhost:3000` locally, then the HTTPS production URL on Vercel. The build can run without a secret so static files can be compiled, but production auth requests deliberately fail fast until `BETTER_AUTH_SECRET` is set.

## Database workflow

1. Update `src/db/schema.ts`.
2. Generate a reviewed migration: `pnpm db:generate`.
3. Inspect the new SQL in `drizzle/` before applying it.
4. Apply it: `pnpm db:migrate`.
5. Populate or repair the demo content: `pnpm db:seed`. The default menu seed is safe to rerun: it inserts missing canonical rows and fills only empty default image URLs, preserving CMS edits.

Do not edit a generated migration after it has been run in a shared environment. Add a new migration instead.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm lint` | Run lint checks |
| `pnpm typecheck` | Run strict TypeScript checks |
| `pnpm test` | Run the Vitest unit, component, and SQLite integration tests |
| `pnpm build` | Produce a production build |
| `pnpm db:studio` | Inspect the configured database with Drizzle Studio |

## Provision the first admin

Public signup is disabled by design. Migration `0001_seed_dev_admin.sql` provisions the development account `dev@cafe.co.id` with a hashed `Cafe123@` credential. Run `pnpm db:migrate` before starting the internal CMS. Additional accounts must be created through an authenticated admin-only provisioning flow; never add an open registration route.

## Storage

Choose one provider before media work starts (Cloudinary, S3-compatible R2, or Vercel Blob are reasonable options). The browser uploads only through a validated server endpoint or signed upload workflow. Store public asset URLs, captions, alt text, and order in the database; never binary image data.

## Vercel + Turso

Set the same environment variables in Vercel. Use Turso's production URL/token, create a preview database strategy if preview writes are needed, and apply migrations in CI or a controlled deploy step rather than on every request.
