# Kōhi Coffee — Cafe Website & CMS

A reusable, fullstack foundation for a premium cafe, coffee shop, bakery, or small restaurant. It follows the product requirements with a public marketing site and a protected admin CMS.

## Stack

- Next.js 16, TypeScript, App Router, React Server Components and Server Actions
- Tailwind CSS v4, shadcn/ui-compatible components, Lucide icons
- Turso (libSQL) + Drizzle ORM
- Better Auth for session-based admin authentication
- Zod for server-side validation

## Start locally

1. Copy `.env.example` to `.env.local` and fill the Turso and Better Auth values.
2. Install dependencies with `pnpm install`.
3. Generate and apply the database migration: `pnpm db:generate && pnpm db:migrate`.
4. Load the realistic demo dataset: `pnpm db:seed`.
5. Run `pnpm dev`.

Read [docs/setup.md](docs/setup.md) for the complete setup and [docs/architecture.md](docs/architecture.md) for the implementation map.

Run the automated suite with `pnpm test`. It covers server-side validation, reservation persistence, auth request forwarding, and every current client-side write/state interaction.
