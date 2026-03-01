# Comprehensive E2E Testing Plan

## Overview
This plan outlines the strategy and task breakdown for implementing a 100% exhaustive, fully automated End-to-End (E2E) testing suite for the SikshaMitra School ERP system. The goal is to cover every module, form, button, and functionality using Playwright, supported by dedicated test data generators to ensure predictable and isolated test environments.

## Project Type
**WEB** (Next.js Application with Playwright for E2E Testing)

## Success Criteria
- 100% coverage of all listed modules and user flows.
- Zero manual testing required for core business functionality after implementation.
- All tests execute successfully in CI/CD pipeline on isolated database branches.
- Robust data generators in place for predictable testing states.

## Tech Stack
- **Testing Framework:** Playwright (for UI and API E2E testing)
- **Data Generation:** Prisma Seed scripts / dedicated fixture generators (e.g., Faker.js)
- **Assertions:** Playwright's built-in auto-waiting assertions
- **CI/CD:** GitHub Actions (or similar) pipeline integration

## File Structure (To be implemented)
```
tests/
├── e2e/
│   ├── auth/                # Login, Role-based redirects
│   ├── super-admin/         # School creation, global settings
│   ├── admin-users/         # Students, Teachers, Parents CRUD
│   ├── academic/            # Classes, Subjects, Routines
│   ├── finance/             # Fee types, Payments, Invoices
│   └── examinations/        # Marks entry, Report cards
├── fixtures/                # Shared data and Page Object Models (POM)
│   ├── auth.fixture.ts
│   └── school.fixture.ts
└── generators/              # Test data generators (scripts)
    └── clean-db.ts
```

---

## Task Breakdown

### Phase 1: Test Infrastructure & Data Generators (P0)

**Task 1.1: Playwright Configuration & Setup**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`, `clean-code`
- **INPUT:** Clean Next.js project.
- **OUTPUT:** configured `playwright.config.ts`, test directories, and global setup scripts.
- **VERIFY:** Running `npx playwright test` passes an empty/dummy test.

**Task 1.2: Database Fixture & Cleanup Utilities**
- **Agent:** `backend-specialist`
- **Skills:** `database-design`, `testing-patterns`
- **INPUT:** Prisma schema.
- **OUTPUT:** Scripts to wipe DB tables cleanly and reset sequences for isolated testing.
- **VERIFY:** Script runs without foreign key constraint errors and leaves DB empty.

**Task 1.3: Core Data Generators (Super Admin & Schools)**
- **Agent:** `backend-specialist`
- **Skills:** `database-design`, `testing-patterns`
- **INPUT:** Clean DB script.
- **OUTPUT:** Generators to programmatically create Super Admin users, Schools, and initial Academic Years.
- **VERIFY:** Running the generator creates a valid school and super admin that can log in.

**Task 1.4: User Data Generators (Students, Parents, Teachers)**
- **Agent:** `backend-specialist`
- **Skills:** `database-design`
- **INPUT:** School fixture.
- **OUTPUT:** Scripts to bulk generate valid Students (with relations to Classes/Parents) and Teachers.
- **VERIFY:** Data appears correct in DB and constraint checks pass.

---

### Phase 2: Authentication & Authorization (P0)

**Task 2.1: Login flows & Session Management**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Auth forms, generated test users.
- **OUTPUT:** E2E tests for Super Admin, Admin, Teacher, Student, and Parent login forms, invalid credentials, and OTP flows.
- **VERIFY:** Playwright tests pass for all user roles.

**Task 2.2: Route Protection & Middleware Access**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Protected routes.
- **OUTPUT:** Tests verifying that a Teacher cannot access Super Admin routes, unauthenticated users are redirected, etc.
- **VERIFY:** 403/Redirects respond accurately in tests.

---

### Phase 3: Super Admin Module (P1)

**Task 3.1: School Management CRUD**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Super admin dashboard.
- **OUTPUT:** Tests for creating, editing, and disabling schools. Form validations for school names, addresses, etc.
- **VERIFY:** School creation E2E test passes.

**Task 3.2: System Settings & Global Configurations**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Super Admin settings page.
- **OUTPUT:** Form tests mimicking changing global variables (e.g., academic year updates).
- **VERIFY:** Config changes reflect across the app for connected schools.

---

### Phase 4: Admin - User Management (P1)

**Task 4.1: Administrator & Teacher CRUD flows**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Admin dashboard > Staff page.
- **OUTPUT:** Automated tests clicking "Add Teacher", filling forms, submitting, and editing existing teacher details.
- **VERIFY:** New staff appear in list tables automatically.

**Task 4.2: Student & Parent CRUD flows**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Admin dashboard > Students page.
- **OUTPUT:** Tests for entering student details, selecting parents (or creating new ones), and verifying list views and profiles.
- **VERIFY:** E2E test handles complex multi-step student-parent creation form.

---

### Phase 5: Academic & Class Management (P2)

**Task 5.1: Classes, Sections, & Subjects**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Academic settings UI.
- **OUTPUT:** Tests validating standard curriculum creation (assigning subjects to classes).
- **VERIFY:** Subjects map correctly to the created classes in the UI test.

**Task 5.2: Timetable & Attendance UI**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Teacher/Admin Attendance module.
- **OUTPUT:** Tests simulating a teacher taking daily attendance and saving records.
- **VERIFY:** Saved attendance renders correctly on Parent/Student dashboards.

---

### Phase 6: Finance & Accounting (P1)

**Task 6.1: Fee Layouts & Configuration**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Accountant dashboard.
- **OUTPUT:** Create fee structures, allocate to specific classes, and view general fee assignment.
- **VERIFY:** Fee Types assigned correctly to target classes without leaking to "All".

**Task 6.2: Fee Collection & Invoicing**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Fee collection modal/form.
- **OUTPUT:** Process a payment entry (cash/online simulation), generate invoice, print receipt.
- **VERIFY:** Student balance is reduced matching the transaction.

---

### Phase 7: Examinations & Report Cards (P1)

**Task 7.1: Exam Creation & Marks Entry**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Examinations dashboard.
- **OUTPUT:** Teacher navigates to exam, enters UT and Main Exam marks for students, and hits save. Validate bounds checking (e.g., marks <= max).
- **VERIFY:** Playwright asserts success toast on marks save.

**Task 7.2: CBSE Report Card Generation View**
- **Agent:** `test-engineer`
- **Skills:** `webapp-testing`
- **INPUT:** Generated marks data.
- **OUTPUT:** E2E test verifying total calculation, grade assignments, and layout structure of the report card view.
- **VERIFY:** Computed Term 1/2 totals match expected math logic.

---

### Phase 8: Automation Pipeline integration (P2)

**Task 8.1: CI/CD Playwright GitHub Action**
- **Agent:** `devops-engineer`
- **Skills:** `bash-linux`, `webapp-testing`
- **INPUT:** Working test suite.
- **OUTPUT:** `.github/workflows/playwright.yml`.
- **VERIFY:** Push to `main` branch triggers full suite and generates a report artifact.

---

## ✅ PHASE X: VERIFICATION CHECKLIST (MANDATORY)

- [ ] Lint & Type Check: `npm run lint && npx tsc --noEmit`
- [ ] Security Scan: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] UX Audit: `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] Lighthouse: `python .agent/skills/performance-profiling/scripts/lighthouse_audit.py http://localhost:3000`
- [ ] **E2E Tests pass completely**: `python .agent/skills/webapp-testing/scripts/playwright_runner.py http://localhost:3000`
- [ ] Build verification: `npm run build`
- [ ] **Data Generators isolated**: Consecutive test runs do not experience DB conflicts.
