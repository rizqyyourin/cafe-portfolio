# Graph Report - cafe-portfolio  (2026-09-10)

## Corpus Check
- Corpus is ~13,625 words - fits in a single context window. You may not need a graph.

## Summary
- 434 nodes · 514 edges · 37 communities (17 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Public Layout Branding
- Architecture Auth Flow
- Reservation Booking Flow
- Development Tooling
- Database Seed Data
- TypeScript Type Definitions
- Runtime Dependencies
- Technical Decisions Setup
- Architecture Data Model
- Domain Data Concepts
- Admin Auth API Shell
- Package Scripts Metadata
- Shared Type Aliases
- Admin Login Dashboard UI
- Admin Content Management
- Auth Data Model
- Privacy Page UI
- About Page UI
- Pricing Currency Rules
- pnpm Workspace Config
- Contact Page UI
- Gallery Page UI
- Admin Role Access
- Reservation Capacity Rules
- Next.js Config
- Next Environment Types
- PostCSS Config
- Menu Validation
- Customer Account Policy
- Online Payment Scope
- Definition of Done
- Icon Library
- UI Component Library

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 12 edges
3. `Kōhi Coffee — Cafe Website & CMS` - 11 edges
4. `CmsPlaceholder()` - 7 edges
5. `siteConfig` - 7 edges
6. `tailwind` - 6 edges
7. `aliases` - 6 edges
8. `Button` - 6 edges
9. `assertAuthIsConfigured()` - 6 edges
10. `include` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Kōhi Brand Defaults` --semantically_similar_to--> `Kōhi Coffee Favicon Wordmark`  [INFERRED] [semantically similar]
  docs/decisions.md → src/app/icon.svg
- `MVP Test Coverage` --semantically_similar_to--> `Automated Test Suite`  [INFERRED] [semantically similar]
  docs/implementation-plan.md → README.md
- `Next.js Agent Rules` --conceptually_related_to--> `Next.js 16 App Router`  [INFERRED]
  AGENTS.md → README.md
- `Kōhi Coffee — Cafe Website & CMS` --references--> `Architecture`  [EXTRACTED]
  README.md → docs/architecture.md
- `Kōhi Coffee — Cafe Website & CMS` --references--> `Local Setup`  [EXTRACTED]
  README.md → docs/setup.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Product Boundary Flows** — docs_architecture_public_visitor_flow, docs_architecture_reservation_form_flow, docs_architecture_cafe_owner_flow [EXTRACTED 1.00]
- **MVP Content Schema** — docs_data_model_categories, docs_data_model_menu_items, docs_data_model_gallery_images, docs_data_model_reservations, docs_data_model_testimonials, docs_data_model_cafe_settings [EXTRACTED 1.00]
- **MVP Completion Path** — docs_implementation_plan_database_read_model, docs_implementation_plan_auth_authorization, docs_implementation_plan_public_content, docs_implementation_plan_cms_actions, docs_implementation_plan_production_hardening [EXTRACTED 1.00]

## Communities (37 total, 16 thin omitted)

### Community 0 - "Public Layout Branding"
Cohesion: 0.07
Nodes (19): inter, metadata, playfairDisplay, plexMono, metadata, favorites, HomePage(), images (+11 more)

### Community 1 - "Architecture Auth Flow"
Cohesion: 0.06
Nodes (34): /admin/login Public Route, Admin Server Action, Admin Authorization, Better Auth Session, Cache and Path Revalidation, Cached Cafe Content, Cafe Owner Flow, Reservation Client UX (+26 more)

### Community 2 - "Reservation Booking Flow"
Cohesion: 0.09
Nodes (21): createReservation(), ReservationActionState, dynamic, metadata, ReservationPage(), formatDateValue(), getTimeOptions(), initialState (+13 more)

### Community 3 - "Development Tooling"
Cohesion: 0.06
Nodes (33): drizzle-kit, eslint, eslint-config-next, jsdom, devDependencies, drizzle-kit, eslint, eslint-config-next (+25 more)

### Community 4 - "Database Seed Data"
Cohesion: 0.09
Nodes (26): categories, imageUrls, menu, client, db, ReservationDatabase, account, accountRelations (+18 more)

### Community 5 - "TypeScript Type Definitions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, es2022, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 6 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (27): better-auth, class-variance-authority, clsx, @daypicker/react, drizzle-orm, @libsql/client, lucide-react, next (+19 more)

### Community 7 - "Technical Decisions Setup"
Cohesion: 0.10
Nodes (21): Next.js Agent Rules, App Router + Server Actions Decision, Better Auth Decision, Kōhi Brand Defaults, Turso + Drizzle Decision, First Admin Provisioning, Operations-only Provisioning Command, Preview Database Strategy (+13 more)

### Community 8 - "Architecture Data Model"
Cohesion: 0.09
Nodes (22): Architecture, Data Model, Realistic Demo Seed Dataset, Drizzle Schema Source of Truth, SQLite/libSQL on Turso, Architecture Decisions, Database and Read Model Plan, Path to PRD-complete MVP (+14 more)

### Community 9 - "Domain Data Concepts"
Cohesion: 0.12
Nodes (22): Public Active-row Queries, cafe_settings Table, CANCELLED Reservation State, categories Table, COMPLETED Reservation State, CONFIRMED Reservation State, gallery_images Table, Independent MVP Records (+14 more)

### Community 10 - "Admin Auth API Shell"
Cohesion: 0.16
Nodes (13): AdminLayout(), dynamic, dynamic, GET(), handlers, POST(), adminNav, AdminSidebar() (+5 more)

### Community 11 - "Package Scripts Metadata"
Cohesion: 0.11
Nodes (18): engines, node, name, packageManager, private, scripts, build, db:generate (+10 more)

### Community 12 - "Shared Type Aliases"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 13 - "Admin Login Dashboard UI"
Cohesion: 0.18
Nodes (8): cards, metadata, LoginForm(), Button, ButtonProps, buttonVariants, authClient, cn()

### Community 15 - "Auth Data Model"
Cohesion: 0.60
Nodes (5): accounts Table, Better Auth User and Session Records, sessions Table, users Table, verifications Table

### Community 18 - "Pricing Currency Rules"
Cohesion: 0.67
Nodes (3): formatRupiah Presentation Formatting, Integer IDR Storage, Integer Rupiah Pricing Decision

### Community 19 - "pnpm Workspace Config"
Cohesion: 0.67
Nodes (3): Build Script Allowlist, pnpm Workspace Configuration, Minimum Release Age Exclusions

## Knowledge Gaps
- **170 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Kōhi Coffee — Cafe Website & CMS` connect `Technical Decisions Setup` to `Architecture Data Model`, `Architecture Auth Flow`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Public Layout Branding` be split into smaller, more focused modules?**
  _Cohesion score 0.07084785133565621 - nodes in this community are weakly interconnected._
- **Should `Architecture Auth Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.06417112299465241 - nodes in this community are weakly interconnected._
- **Should `Reservation Booking Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._
- **Should `Development Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Database Seed Data` be split into smaller, more focused modules?**
  _Cohesion score 0.0907258064516129 - nodes in this community are weakly interconnected._