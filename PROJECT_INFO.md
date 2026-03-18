# SikshaMitra ERP - Project Information

## Overview

**Name:** SikshaMitra ERP  
**Version:** 2.0.0  
**Type:** Multi-tenant School Management System (SaaS)  
**Status:** Production Ready  
**Last Updated:** February 2026

SikshaMitra is a comprehensive, multi-tenant school ERP built with Next.js 16. It provides full academic, administrative, financial, and communication management for educational institutions, with subdomain-based multi-tenancy and a super-admin layer for managing multiple schools.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19, Tailwind CSS 3.4, shadcn/ui, Radix UI |
| ORM | Prisma 5.22 |
| Database | PostgreSQL |
| Auth | NextAuth v5 (beta.30) + 2FA (TOTP/speakeasy) |
| Storage | Cloudflare R2 (AWS S3-compatible) |
| Email | Resend |
| SMS | MSG91 |
| WhatsApp | WhatsApp Business API |
| Payment | Razorpay |
| Rate Limiting | Upstash Redis |
| Charts | Recharts 3 |
| PDF | jsPDF + jspdf-autotable |
| Excel | ExcelJS |
| Testing | Vitest 4, Playwright, Testing Library |
| Animations | Framer Motion |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |

---

## User Roles

- **SUPER_ADMIN** - Platform owner, manages all schools
- **ADMIN** - School administrator
- **TEACHER** - Teaching staff
- **STUDENT** - Enrolled students
- **PARENT** - Parent/guardian
- **ALUMNI** - Former students

---

## Key Features

- Multi-tenant architecture with subdomain routing (e.g. `school.sikshamitra.com`)
- Academic management: classes, sections, subjects, timetables, syllabus, curriculum
- Examination system: traditional + online exams, auto-grading, CBSE report cards
- Finance: fee structures, payments (Razorpay), scholarships, payroll, receipts
- Library: books, issue/return, reservations, fine management
- Transport: routes, vehicles, drivers, attendance tracking
- Hostel: room allocation, visitor management, complaints
- Communication: messaging, announcements, bulk SMS/WhatsApp/email
- LMS: courses, modules, lessons, progress tracking, flashcards, mind maps
- Admission portal: online applications, document upload, merit lists, conversion to student
- Certificates: template-based generation with QR verification
- Alumni portal: directory, profiles, news
- Analytics: dashboards, reports, charts, scheduled reports, export (PDF/Excel/CSV)
- Security: RBAC, 2FA, CSRF, rate limiting, audit logging, IP whitelisting, session management
- Backup: scheduled encrypted backups, restore
- Onboarding wizard for new schools

---

## Environment Variables (Key)

```env
# App
NEXT_PUBLIC_APP_URL=
ROOT_DOMAIN=
NEXT_PUBLIC_ROOT_DOMAIN=

# Auth
AUTH_SECRET=
AUTH_URL=
AUTH_TRUST_HOST=

# Database
DATABASE_URL=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_CUSTOM_DOMAIN=
R2_ENDPOINT=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# 2FA
TWO_FACTOR_ENCRYPTION_KEY=

# Payment
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Rate Limiting
REDIS_URL=
REDIS_TOKEN=

# SMS
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_TEMPLATE_ID=

# WhatsApp
WHATSAPP_API_URL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

---

## Scripts

```bash
npm run dev                  # Start dev server
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # TypeScript check (tsc --noEmit)
npm run db:seed              # Seed database
npm run test                 # Run Vitest (watch)
npm run test:run             # Run Vitest (single pass)
npm run test:e2e             # Run Playwright E2E tests
npm run test:security        # Run security tests
npm run verify:production    # Verify production readiness
npm run validate-env         # Validate env vars
npm run cleanup:sessions     # Clean expired sessions
npm run import:alumni        # Import historical alumni
npm run setup:r2             # Setup R2 bucket
npm run migrate:syllabus     # Migrate syllabus to modules
npm run migrate:fee-structures  # Migrate fee structure classes
```

---

## Database

- **ORM:** Prisma 5.22
- **DB:** PostgreSQL
- **Schema:** `prisma/schema.prisma` (~4771 lines)
- **Migrations:** `prisma/migrations/`

### Key Migrations
- `001_unified_auth_multitenant_schema.sql`
- `002_schools_management_fixes.sql`
- `002_student_portal_phase2_features.sql`
- `003_performance_optimizations.sql`
- `20260124_init_multi_tenancy`
- `20260124_add_enhanced_billing_and_super_admin_models`
- `20260127_add_rate_limiting_models`
- `20260206_add_section_to_subject_class`
- `20260209_consolidate_school_settings`
- `20260306_add_class_id_to_exam`
- `20260315_add_cbse_report_card_models`

### Seed Files
- `prisma/seed.ts` - Main seed
- `prisma/seed-subscription-plans.ts`
- `prisma/seed-permissions.ts`
- `prisma/seed-certificate-templates.ts`
- `prisma/seed-message-templates.ts`
- `prisma/seed-calendar-categories.ts`
- `prisma/seed-promotion-alumni-templates.ts`
- `prisma/seed-dashboard.ts`

### Default Credentials (after seed)
| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@example.com | password123 |
| Admin | admin@example.com | password123 |
| Teacher | teacher@example.com | password123 |
| Student | student@example.com | password123 |
| Parent | parent@example.com | password123 |

---

---

## Full Project Folder Tree

```
sikshamitra-erp/
├── .agent/                          # AI agent config & skills
│   ├── agents/                      # Specialized agent definitions
│   ├── rules/
│   ├── scripts/
│   ├── skills/                      # Skill modules (api-patterns, architecture, etc.)
│   ├── workflows/
│   └── ARCHITECTURE.md
├── .claude/
│   └── settings.local.json
├── .github/                         # GitHub Actions / CI config
├── .vscode/                         # VSCode workspace settings
├── backups/                         # Encrypted scheduled backups (.enc files)
├── docs/                            # Active documentation
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE.md
│   ├── CERTIFICATE_GENERATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── MULTI_TENANCY.md
│   ├── SCHOOL_SETTINGS_API.md
│   ├── SCHOOL_SETTINGS_MIGRATION.md
│   ├── SECURITY.md
│   ├── SENTRY_SETUP.md
│   ├── SUPER_ADMIN_GUIDE.md
│   └── USER_GUIDES.md
├── docs-archive/                    # Archived planning/fix docs
├── docs-archive-detailed/           # Detailed implementation docs (archived)
├── prisma/
│   ├── migrations/                  # SQL migration files
│   ├── seeds/
│   ├── schema.prisma                # Main Prisma schema (~4771 lines)
│   ├── seed.ts                      # Main seed entry
│   ├── seed-subscription-plans.ts
│   ├── seed-permissions.ts
│   ├── seed-certificate-templates.ts
│   ├── seed-message-templates.ts
│   ├── seed-calendar-categories.ts
│   ├── seed-promotion-alumni-templates.ts
│   └── seed-dashboard.ts
├── public/                          # Static assets (icons, favicon, logo, manifest)
├── scripts/                         # Utility/migration/verification scripts
├── security-audit-results/          # Security audit output
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Auth layout group
│   │   │   ├── login/[[...rest]]/
│   │   │   ├── register/[[...rest]]/
│   │   │   ├── forgot-password/[[...rest]]/
│   │   │   └── verify-email/
│   │   ├── admin/                   # School admin portal
│   │   │   ├── page.tsx
│   │   │   ├── academic/            # Academic year, terms, classes, sections
│   │   │   ├── admissions/          # Admission management
│   │   │   ├── alumni/              # Alumni management
│   │   │   ├── assessments/         # Exams, assignments, marks, results
│   │   │   ├── attendance/          # Student & teacher attendance
│   │   │   ├── calendar/
│   │   │   ├── certificates/        # Certificate generation
│   │   │   ├── communication/       # Messages, announcements, notifications
│   │   │   ├── courses/             # LMS course management
│   │   │   ├── documents/
│   │   │   ├── events/
│   │   │   ├── finance/             # Fees, payments, receipts, payroll, budgets
│   │   │   ├── hostel/
│   │   │   ├── id-cards/
│   │   │   ├── library/
│   │   │   ├── reports/             # Academic, attendance, financial, performance, builder
│   │   │   ├── settings/            # School settings, branding, backups, permissions
│   │   │   ├── teaching/            # Subjects, timetable
│   │   │   ├── transport/           # Routes, vehicles, attendance
│   │   │   └── users/               # Students, teachers, parents, administrators
│   │   ├── alumni/                  # Alumni portal
│   │   │   ├── dashboard/
│   │   │   ├── directory/
│   │   │   └── profile/
│   │   ├── api/                     # API routes
│   │   │   ├── admin/               # Admin-specific APIs
│   │   │   ├── auth/                # Auth endpoints (login, register, OTP, reset, etc.)
│   │   │   ├── calendar/            # Calendar CRUD + import/export
│   │   │   ├── cdn/                 # CDN URL generation
│   │   │   ├── classes/
│   │   │   ├── cron/                # Cron jobs (session cleanup)
│   │   │   ├── csrf-token/
│   │   │   ├── example/
│   │   │   ├── files/
│   │   │   ├── integrations/        # External integrations
│   │   │   ├── notifications/
│   │   │   ├── otp/
│   │   │   ├── parent/
│   │   │   ├── parents/
│   │   │   ├── payments/            # Razorpay create/verify/webhook
│   │   │   ├── permissions/
│   │   │   ├── r2/                  # R2 storage (upload, presigned, batch)
│   │   │   ├── reports/             # Report card, subject performance
│   │   │   ├── schools/
│   │   │   ├── search/
│   │   │   ├── storage/             # Storage quota & analytics
│   │   │   ├── student/             # Student-specific APIs
│   │   │   ├── students/
│   │   │   ├── subdomain/           # Subdomain detect/manage/validate
│   │   │   ├── super-admin/         # Super admin APIs
│   │   │   │   ├── analytics/       # Revenue, usage, churn, dashboard, auth analytics
│   │   │   │   ├── audit/           # Audit logs
│   │   │   │   ├── billing/         # Subscriptions, payments, refunds
│   │   │   │   ├── configuration/   # Feature flags, settings
│   │   │   │   ├── emergency/       # Emergency access controls
│   │   │   │   ├── monitoring/      # Health, alerts, performance
│   │   │   │   ├── plans/           # Subscription plans
│   │   │   │   ├── schools/         # School CRUD + bulk + onboarding + settings
│   │   │   │   ├── security/        # Rate limits, blocked identifiers
│   │   │   │   ├── support/         # Tickets, knowledge base
│   │   │   │   ├── system/          # Health, docs
│   │   │   │   └── users/           # Cross-school user management
│   │   │   ├── teacher/             # Teacher-specific APIs
│   │   │   ├── upload/
│   │   │   ├── user/                # Profile, sessions
│   │   │   ├── users/
│   │   │   └── webhooks/            # Stripe, MSG91, WhatsApp, monitoring
│   │   ├── auth/                    # Auth pages (reset-password)
│   │   ├── auth-redirect/
│   │   ├── dashboard/
│   │   ├── parent/                  # Parent portal
│   │   │   ├── academics/           # Homework, schedule, subjects, timetable
│   │   │   ├── attendance/
│   │   │   ├── calendar/
│   │   │   ├── children/            # Per-child views, compare, overview
│   │   │   ├── communication/       # Messages, announcements, notifications
│   │   │   ├── documents/
│   │   │   ├── events/
│   │   │   ├── fees/                # Overview, history, payment, receipts, upload
│   │   │   ├── meetings/            # Schedule, upcoming, history
│   │   │   ├── performance/         # Report cards, results, reports
│   │   │   └── settings/            # Sessions, 2FA
│   │   ├── sd/                      # Subdomain detection page
│   │   ├── select-child/
│   │   ├── select-school/
│   │   ├── setup/                   # School onboarding wizard
│   │   ├── student/                 # Student portal
│   │   │   ├── academics/           # Subjects, schedule, syllabus
│   │   │   ├── achievements/
│   │   │   ├── assessments/         # Assignments, exams (online), report cards, results
│   │   │   ├── attendance/          # Leave applications, report
│   │   │   ├── calendar/
│   │   │   ├── communication/       # Messages, announcements, notifications
│   │   │   ├── courses/             # LMS courses + lessons
│   │   │   ├── documents/
│   │   │   ├── events/
│   │   │   ├── fees/                # Details, due, payments, receipts, scholarships
│   │   │   ├── learn/               # Lesson viewer
│   │   │   ├── performance/         # Overview, rank, subjects, trends
│   │   │   ├── profile/
│   │   │   ├── settings/            # Sessions, 2FA
│   │   │   └── study-tools/         # Flashcards, mind maps, notes
│   │   ├── super-admin/             # Super admin portal
│   │   │   ├── analytics/           # Platform analytics + auth analytics
│   │   │   ├── audit/
│   │   │   ├── billing/
│   │   │   ├── emergency/
│   │   │   ├── monitoring/
│   │   │   ├── plans/
│   │   │   ├── schools/             # School list + per-school management
│   │   │   │   └── [id]/            # Overview, activity, analytics, billing,
│   │   │   │                        # settings, setup, users, subscription
│   │   │   ├── settings/
│   │   │   ├── storage/
│   │   │   ├── support/
│   │   │   └── users/
│   │   ├── teacher/                 # Teacher portal
│   │   │   ├── achievements/
│   │   │   ├── assessments/         # Assignments, exams, online exams, question bank, results
│   │   │   ├── attendance/          # Mark attendance, reports
│   │   │   ├── calendar/
│   │   │   ├── communication/       # Messages, announcements
│   │   │   ├── courses/
│   │   │   ├── documents/
│   │   │   ├── events/
│   │   │   ├── settings/            # Sessions, 2FA
│   │   │   ├── students/            # Student list, attendance, performance
│   │   │   └── teaching/            # Classes, subjects, syllabus, timetable
│   │   ├── admission/               # Public admission portal
│   │   ├── verify-certificate/      # Public certificate verification
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── academic/                # Syllabus, modules, sub-modules, promotion wizard
│   │   ├── accessibility/           # Skip links, ARIA live regions, keyboard nav
│   │   ├── admin/                   # Admin-specific components
│   │   │   ├── admissions/
│   │   │   ├── alumni/
│   │   │   ├── assessment/
│   │   │   ├── attendance/
│   │   │   ├── backups/
│   │   │   ├── certificates/
│   │   │   ├── communication/       # Bulk messaging, templates, analytics
│   │   │   ├── id-cards/
│   │   │   ├── library/
│   │   │   ├── permissions/
│   │   │   ├── promotion/
│   │   │   ├── report-cards/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── syllabus/
│   │   │   └── transport/
│   │   ├── alumni/
│   │   ├── attendance/
│   │   ├── auth/                    # Login, register, school/child selection, session
│   │   ├── calendar/                # Full calendar UI with events, notes, reminders
│   │   ├── dashboard/
│   │   ├── fees/                    # Fee structures, receipts
│   │   ├── forms/
│   │   ├── layout/                  # Header, sidebar, portal wrappers
│   │   ├── navigation/              # Mobile navigation
│   │   ├── onboarding/              # Setup wizard steps
│   │   ├── parent/                  # Parent-specific components
│   │   ├── providers/               # Theme provider
│   │   ├── shared/                  # Shared across portals
│   │   ├── student/                 # Student-specific components
│   │   ├── super-admin/             # Super admin components
│   │   │   ├── analytics/
│   │   │   ├── audit/
│   │   │   ├── billing/
│   │   │   ├── dashboard/
│   │   │   ├── debug/
│   │   │   ├── emergency/
│   │   │   ├── layout/
│   │   │   ├── monitoring/
│   │   │   ├── plans/
│   │   │   ├── schools/
│   │   │   ├── security/
│   │   │   ├── storage/
│   │   │   ├── support/
│   │   │   ├── system/
│   │   │   └── users/
│   │   ├── teacher/                 # Teacher-specific components
│   │   ├── test/
│   │   ├── ui/                      # shadcn/ui base components + custom
│   │   ├── upload/                  # R2 upload widgets
│   │   └── users/                   # Shared user tables
│   ├── context/
│   │   └── permissions-context.tsx
│   ├── hooks/                       # Custom React hooks
│   ├── lib/
│   │   ├── actions/                 # Next.js Server Actions (~120+ files)
│   │   ├── auth/                    # Auth helpers, session refresh, tenant
│   │   ├── config/                  # R2 config
│   │   ├── constants/               # Permissions, CBSE subjects, fee standards
│   │   ├── context/                 # Subdomain context
│   │   ├── contexts/                # Branding, query, theme contexts
│   │   ├── middleware/              # Auth, CSRF, rate limit, validation, subdomain
│   │   ├── models/                  # Onboarding progress model
│   │   ├── schemas/                 # Zod schemas
│   │   ├── schemaValidation/        # Per-entity Zod validation (~50+ files)
│   │   ├── services/                # Business logic services (~80+ files)
│   │   ├── templates/               # Email & WhatsApp templates
│   │   ├── types/                   # Shared TypeScript types
│   │   ├── utils/                   # Utility functions (~80+ files)
│   │   ├── auth.ts                  # NextAuth config
│   │   ├── auth-context.tsx
│   │   ├── auth-helpers.ts
│   │   ├── auth-utils.ts
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── password.ts
│   │   ├── role-utils.ts
│   │   ├── tenant-context.ts
│   │   └── utils.ts
│   ├── scripts/                     # One-off fix scripts
│   ├── styles/
│   │   └── datepicker.css
│   ├── test/                        # Unit & integration tests
│   │   ├── api/                     # API integration tests
│   │   ├── database/
│   │   ├── e2e/                     # E2E scenario tests
│   │   ├── integration/
│   │   ├── security/
│   │   └── setup.ts
│   └── types/                       # Global TypeScript types
├── tests/                           # Playwright E2E tests
│   ├── e2e/
│   │   ├── admin/                   # Admin portal E2E
│   │   ├── auth/                    # Login, protected routes
│   │   ├── school-admin/
│   │   └── super-admin/
│   ├── fixtures/
│   └── generators/                  # DB setup for tests
├── .env                             # Local env (gitignored)
├── .env.example                     # Env template
├── .env.production.template         # Production env template
├── .env.subdomain.example           # Subdomain env example
├── .eslintrc.json
├── .gitignore
├── components.json                  # shadcn/ui config
├── middleware.ts                    # Next.js middleware (subdomain routing, auth)
├── next.config.js
├── next-env.d.ts
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.production.json
├── tsconfig.test.json
└── vitest.config.ts
```

---

## Architecture Overview

### Multi-Tenancy
- Subdomain-based routing: `school.sikshamitra.com` → school context resolved in `middleware.ts`
- `SubdomainContext` provides school data to all server components
- All DB queries scoped by `schoolId` for tenant isolation
- Per-school storage quotas in Cloudflare R2

### Authentication Flow
1. User visits login page → enters mobile/email
2. OTP generated via MSG91 (or password auth)
3. OTP verified → NextAuth session created
4. If user belongs to multiple schools → `select-school` page
5. If parent with multiple children → `select-child` page
6. Role-based redirect via `RoleRouterService`

### Server Actions Pattern
All mutations use Next.js Server Actions in `src/lib/actions/`. Each action:
- Validates session and school context
- Validates input with Zod schemas
- Calls Prisma with `schoolId` filter
- Returns `{ success, data, error }` shape

### Middleware (`middleware.ts`)
- Subdomain detection and school context injection
- Route protection by role
- CSRF token validation
- Rate limiting (Redis/in-memory fallback)

### Key Services
| Service | Purpose |
|---|---|
| `school-service.ts` | School CRUD, settings |
| `billing-service.ts` | Subscriptions, payments |
| `analytics-service.ts` | Platform analytics |
| `audit-service.ts` | Audit log writes/reads |
| `monitoring-service.ts` | Health checks, alerts |
| `rate-limiting-service.ts` | Redis-backed rate limits |
| `r2-storage-service.ts` | File upload/download |
| `enhanced-r2-storage-service.ts` | Chunked uploads, CDN |
| `notification-service.ts` | Email/SMS/WhatsApp dispatch |
| `report-card-cbse-renderer.ts` | CBSE report card PDF |
| `certificate-generation-service.ts` | Certificate PDF + QR |
| `emergency-access-service.ts` | Emergency school/user disable |
| `onboarding-progress-service.ts` | School setup wizard state |
| `user-management-service.ts` | Cross-school user ops |
| `permission-service.ts` | RBAC permission checks |
| `session-context-service.ts` | Multi-school session context |

---

## Testing

### Unit/Integration (Vitest)
- Location: `src/test/`, `src/lib/**/__tests__/`, `src/components/**/__tests__/`
- Config: `vitest.config.ts`
- Run: `npm run test:run`

### E2E (Playwright)
- Location: `tests/e2e/`
- Config: `playwright.config.ts`
- Run: `npm run test:e2e`

### Test Categories
- Auth endpoints (login, OTP, register, context-switch)
- Rate limiting
- School creation & onboarding
- Billing & subscriptions
- Analytics
- Permission system
- Monitoring
- Emergency access
- Data management
- Property-based tests (fast-check)

---

## Documentation Index

| File | Description |
|---|---|
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/API_REFERENCE.md` | API endpoints reference |
| `docs/DATABASE_SCHEMA.md` | DB models & relationships |
| `docs/SECURITY.md` | Security implementation |
| `docs/DEPLOYMENT.md` | Production deployment |
| `docs/DEVELOPMENT.md` | Dev setup guide |
| `docs/MULTI_TENANCY.md` | Multi-school architecture |
| `docs/SUPER_ADMIN_GUIDE.md` | Super admin operations |
| `docs/USER_GUIDES.md` | End-user guides |
| `docs/CERTIFICATE_GENERATION.md` | Certificate system |
| `docs/SCHOOL_SETTINGS_API.md` | School settings API |
| `README.md` | Project overview & quick start |
