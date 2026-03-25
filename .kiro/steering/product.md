# SikshaMitra ERP - Product Overview

SikshaMitra is a multi-tenant SaaS school management system (ERP) for educational institutions in India. It provides a unified platform for academic, administrative, financial, and communication management.

## User Roles
- **SUPER_ADMIN** - Platform owner; manages all schools, billing, and platform health
- **ADMIN** - School administrator; manages school-level operations
- **TEACHER** - Teaching staff; manages classes, assessments, attendance
- **STUDENT** - Enrolled students; accesses academics, fees, communication
- **PARENT** - Parent/guardian; monitors children's progress and fees
- **ALUMNI** - Former students; accesses alumni portal and directory

## Core Modules
- Academic management (classes, sections, subjects, timetables, syllabus)
- Examination system (traditional + online exams, CBSE report cards, auto-grading)
- Finance (fee structures, Razorpay payments, scholarships, payroll, receipts)
- Communication (messaging, announcements, bulk SMS/WhatsApp/email)
- LMS (courses, modules, lessons, flashcards, mind maps)
- Admission portal (online applications, document upload, merit lists)
- Library, Transport, Hostel management
- Certificates (template-based PDF generation with QR verification)
- Alumni portal
- Analytics, scheduled reports, data export (PDF/Excel/CSV)
- Security (RBAC, 2FA, CSRF, rate limiting, audit logging, IP whitelisting)
- Backup/restore (scheduled encrypted backups)
- School onboarding wizard

## Multi-Tenancy Model
Each school gets subdomain-based routing (e.g. `school.sikshamitra.com`). All data is isolated by `schoolId`. The super-admin layer manages cross-school operations.
