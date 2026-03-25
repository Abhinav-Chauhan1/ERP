# Project Structure

## Top-Level Layout
```
sikshamitra-erp/
├── src/                    # All application source code
├── prisma/                 # DB schema, migrations, seed files
├── public/                 # Static assets (icons, favicon, logo)
├── scripts/                # One-off utility/migration scripts (tsx)
├── tests/                  # Playwright E2E tests
├── docs/                   # Active documentation
├── docs-archive/           # Archived planning docs (do not edit)
├── docs-archive-detailed/  # Archived implementation docs (do not edit)
├── backups/                # Encrypted scheduled backups (.enc)
├── middleware.ts           # Next.js middleware (root level)
└── .kiro/                  # Kiro AI config (steering, specs)
```

## `src/` Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth layout group (login, register, forgot-password)
│   ├── admin/              # School admin portal pages
│   ├── teacher/            # Teacher portal pages
│   ├── student/            # Student portal pages
│   ├── parent/             # Parent portal pages
│   ├── super-admin/        # Super admin portal pages
│   ├── alumni/             # Alumni portal pages
│   ├── api/                # API route handlers
│   ├── admission/          # Public admission portal
│   ├── verify-certificate/ # Public certificate verification
│   ├── setup/              # School onboarding wizard
│   ├── select-school/      # Multi-school selector
│   ├── select-child/       # Multi-child selector (parents)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing/root page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui base components + custom primitives
│   ├── admin/              # Admin-specific components
│   ├── teacher/            # Teacher-specific components
│   ├── student/            # Student-specific components
│   ├── parent/             # Parent-specific components
│   ├── super-admin/        # Super admin components
│   ├── alumni/             # Alumni components
│   ├── auth/               # Auth flow components
│   ├── layout/             # Header, sidebar, portal wrappers
│   ├── calendar/           # Calendar UI
│   ├── shared/             # Shared across portals
│   └── accessibility/      # Skip links, ARIA helpers
├── lib/
│   ├── actions/            # Next.js Server Actions (~120+ files, one per domain)
│   ├── services/           # Business logic services (~80+ files)
│   ├── schemas/            # Zod schemas (shared)
│   ├── schemaValidation/   # Per-entity Zod validation (~50+ files)
│   ├── middleware/         # Auth, CSRF, rate limit, validation, subdomain middleware
│   ├── utils/              # Utility functions (~80+ files)
│   ├── auth/               # Auth helpers, session, tenant context
│   ├── constants/          # Permissions, CBSE subjects, fee standards
│   ├── templates/          # Email & WhatsApp message templates
│   ├── types/              # Shared TypeScript types
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # General utilities (cn, etc.)
├── hooks/                  # Custom React hooks
├── context/                # React context providers
├── types/                  # Global TypeScript type declarations
└── test/                   # Vitest unit/integration tests
    ├── api/
    ├── security/
    ├── integration/
    └── setup.ts
```

## Key Architectural Patterns

### Server Actions (mutations)
All data mutations go through Next.js Server Actions in `src/lib/actions/`. Pattern:
- Validate session + school context
- Validate input with Zod
- Query Prisma with `schoolId` filter
- Return `{ success: boolean, data?, error? }`

### API Routes (reads/webhooks/external)
REST API routes in `src/app/api/`. Used for external integrations, webhooks, and some read endpoints.

### Multi-Tenancy
- Subdomain resolved in `middleware.ts` → school context injected into request headers
- Every DB query must include `schoolId` for tenant isolation
- `src/lib/auth/` contains tenant context helpers

### Component Organization
- Role-specific components live under `src/components/{role}/`
- Shared UI primitives in `src/components/ui/` (shadcn/ui)
- Page-level components co-located with their route in `src/app/`

### Prisma
- Single client instance exported from `src/lib/db.ts`
- Schema at `prisma/schema.prisma`
- Migrations in `prisma/migrations/`
- Multiple seed files for different data domains

### Testing
- Unit/integration tests: `src/test/` and co-located `__tests__/` folders
- E2E tests: `tests/e2e/` (Playwright)
- Property-based tests use `fast-check`
