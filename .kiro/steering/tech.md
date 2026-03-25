# Tech Stack & Build System

## Core Framework
- **Next.js 16** (App Router) with React 19 and TypeScript 5.9
- **Strict TypeScript** — `strict: true`, `noEmit: true`; `npm run lint` runs `tsc --noEmit`
- Path alias: `@/*` maps to `./src/*`

## UI
- **Tailwind CSS 3.4** with CSS variables for theming (HSL-based color tokens)
- **shadcn/ui** component library (config: `components.json`) built on **Radix UI** primitives
- **Framer Motion** for animations
- **Lucide React** for icons
- **Recharts 3** for charts
- Dark mode via `next-themes` using `class` strategy

## Data & State
- **Prisma 5.22** ORM with **PostgreSQL**
- **TanStack Query v5** for client-side data fetching and caching
- **React Hook Form** + **Zod** for form validation
- Server mutations use **Next.js Server Actions** (not API routes for mutations)

## Authentication
- **NextAuth v5** (beta.30) with `@auth/prisma-adapter`
- 2FA via TOTP (speakeasy + otpauth)
- Session stored in database via Prisma adapter

## Storage & External Services
- **Cloudflare R2** (S3-compatible) for file storage via `@aws-sdk/client-s3`
- **Resend** for email
- **MSG91** for SMS
- **WhatsApp Business API** for WhatsApp notifications
- **Razorpay** for payments
- **Upstash Redis** for rate limiting

## Testing
- **Vitest 4** for unit/integration tests (jsdom environment, globals enabled)
- **Playwright** for E2E tests
- **Testing Library** (React + user-event) for component tests
- **fast-check** for property-based tests
- **@faker-js/faker** for test data generation
- Test setup file: `src/test/setup.ts`

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # TypeScript type check (tsc --noEmit)

# Database
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Run migrations in dev
npx prisma migrate deploy # Apply migrations in production
npm run db:seed          # Seed database (tsx prisma/seed.ts)

# Testing
npm run test:run         # Run Vitest once (non-watch)
npm run test             # Run Vitest in watch mode
npm run test:e2e         # Run Playwright E2E tests
npm run test:security    # Run security-specific tests

# Utilities
npm run validate-env     # Validate required env vars
npm run verify:production # Verify production readiness
npm run cleanup:sessions # Clean expired sessions
npm run setup:r2         # Setup Cloudflare R2 bucket
```

## Key Config Files
- `next.config.js` — Next.js config (image domains, security headers, subdomain rewrites)
- `tailwind.config.js` — Tailwind theme with CSS variable tokens
- `tsconfig.json` — TypeScript config (excludes scripts, seeds, and test files from type checking)
- `vitest.config.ts` — Vitest config
- `playwright.config.ts` — Playwright E2E config
- `prisma/schema.prisma` — Main DB schema (~4800 lines)
- `middleware.ts` — Next.js middleware (subdomain routing, auth, CSRF, rate limiting)
