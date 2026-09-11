# Documentation index

This folder is the implementation handoff for the Cafe Website & CMS. The codebase is a phase-one scaffold, not a claim that the MVP has been completed.

| Document | Use it for |
| --- | --- |
| [setup.md](setup.md) | Local environment, migrations, seed data, and deployment prerequisites |
| [architecture.md](architecture.md) | App boundaries, routes, data flow, cache strategy, and security model |
| [data-model.md](data-model.md) | Drizzle tables, relationships, data rules, and migration conventions |
| [implementation-plan.md](implementation-plan.md) | Ordered path from scaffold to PRD-complete MVP |
| [decisions.md](decisions.md) | Decisions already made and deliberately deferred choices |

## Scope status

Implemented foundation: Next.js + TypeScript project configuration, styling foundation, public/admin route map, Better Auth integration boundary, Drizzle schema, Zod reservation validation, reservation server action, metadata/robots/sitemap, and realistic demo seed source.

Still to implement: query/repository layer, actual media provider, database-backed public components, admin CRUD screens/actions, rate limiting, and deployment. Each is intentionally tracked in [implementation-plan.md](implementation-plan.md).
