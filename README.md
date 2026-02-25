# 🎓 SikshaMitra ERP - School Management System

**Version:** 1.0 (Production Ready)  
**Status:** ✅ Ready for Deployment  
**Last Updated:** February 15, 2026

## Overview

SikshaMitra ERP is a comprehensive, multi-tenant school management system built with Next.js 16, providing complete academic, administrative, and financial management capabilities for educational institutions.

## 🚀 Production Launch

**Ready to deploy?** We've prepared everything you need:

### Quick Launch
```bash
# 1. Verify production readiness
npm run verify:production

# 2. Follow deployment guide
# See: DEPLOY_NOW.md

# 3. Deploy to production
vercel --prod
```

### Launch Documentation
- **[LAUNCH_READINESS_SUMMARY.md](LAUNCH_READINESS_SUMMARY.md)** - ⭐ Start here - Complete readiness overview
- **[DEPLOY_NOW.md](DEPLOY_NOW.md)** - Step-by-step deployment guide
- **[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)** - Comprehensive launch checklist
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Testing guide
- **[MONITORING_MAINTENANCE.md](MONITORING_MAINTENANCE.md)** - Operations guide
- **[.env.production.template](.env.production.template)** - Production environment template

## Key Features

- 🎓 **Academic Management**: Classes, subjects, timetables, syllabus, and curriculum
- 👥 **User Management**: Students, teachers, parents, and administrators with role-based access
- 📊 **Examination System**: Traditional and online exams with automated grading
- 💰 **Finance Management**: Fee structures, payments, scholarships, and billing
- 📚 **Library System**: Book management, issue/return tracking, and reservations
- 🚌 **Transport Management**: Routes, vehicles, drivers, and attendance tracking
- 🏢 **Hostel Management**: Room allocation, visitor management, and complaints
- 📱 **Communication**: Messaging, announcements, notifications (Email/SMS/WhatsApp)
- 🎯 **LMS**: Course creation, modules, lessons, and progress tracking
- 🎓 **Admission Portal**: Online applications, document upload, and merit lists
- 🏆 **Certificates**: Template-based certificate generation with verification
- 📈 **Analytics**: Comprehensive reporting and data visualization
- 🔐 **Security**: NextAuth v5, 2FA, RBAC, audit logging, and CSRF protection
- 🏢 **Multi-Tenancy**: Separate databases and storage per school

## Technology Stack

**Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui  
**Backend**: Node.js, PostgreSQL, Prisma ORM  
**Authentication**: NextAuth v5 with 2FA support  
**Storage**: Cloudinary / R2  
**Communication**: Resend (Email), MSG91 (SMS), WhatsApp Business API  
**Payment**: Razorpay  
**Testing**: Vitest, Testing Library

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd sikshamitra-erp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma generate
npx prisma migrate deploy
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Default Credentials

After seeding, use these credentials:

**Super Admin**: superadmin@example.com / password123  
**Admin**: admin@example.com / password123  
**Teacher**: teacher@example.com / password123  
**Student**: student@example.com / password123  
**Parent**: parent@example.com / password123

## Documentation

### 🚀 Production Launch (NEW!)
- **[LAUNCH_READINESS_SUMMARY.md](LAUNCH_READINESS_SUMMARY.md)** - ⭐ Complete readiness overview
- **[DEPLOY_NOW.md](DEPLOY_NOW.md)** - Step-by-step deployment guide
- **[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)** - Comprehensive launch checklist
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Testing guide
- **[MONITORING_MAINTENANCE.md](MONITORING_MAINTENANCE.md)** - Operations guide
- **[PRODUCTION_READY_SUMMARY.md](PRODUCTION_READY_SUMMARY.md)** - Quick production overview

### Core Documentation
- [Architecture Guide](docs/ARCHITECTURE.md) - System architecture and design patterns
- [API Reference](docs/API_REFERENCE.md) - Complete API documentation
- [Database Schema](docs/DATABASE_SCHEMA.md) - Database models and relationships
- [Security Guide](docs/SECURITY.md) - Security implementation and best practices

### Developer Guides
- [Development Guide](docs/DEVELOPMENT.md) - Setup and development workflow
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Testing Guide](docs/TESTING.md) - Testing strategies and guidelines
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute

### User Guides
- **[docs/USER_GUIDES.md](docs/USER_GUIDES.md)** - ⭐ Complete user guides (Admin, Teacher, Parent, Student, FAQ)
- [Super Admin Guide](docs/SUPER_ADMIN_GUIDE.md) - Multi-school management
- [Admin Guide](docs/ADMIN_GUIDE.md) - School administration
- [User Manual](docs/USER_MANUAL.md) - Complete user documentation

### Feature Documentation
- [Authentication](docs/AUTHENTICATION.md) - Auth system and 2FA
- [Multi-Tenancy](docs/MULTI_TENANCY.md) - Multi-school architecture
- [Communication](docs/COMMUNICATION.md) - Messaging and notifications
- [Payment Integration](docs/PAYMENTS.md) - Payment gateway setup

## Project Structure

```
sikshamitra-erp/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and services
│   │   ├── actions/      # Server actions
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Helper functions
│   ├── types/            # TypeScript types
│   └── styles/           # Global styles
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:security # Run security tests

# Database
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Production Verification (NEW!)
npm run verify:production  # Verify production readiness
npm run validate-env       # Validate environment variables
npm run test:r2           # Test R2 storage setup
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Storage
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email
RESEND_API_KEY="your-resend-key"

# SMS
MSG91_AUTH_KEY="your-msg91-key"

# Payment
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
```

## Multi-Tenancy

Each school operates with:
- Separate database (recommended) or shared database with tenant isolation
- Isolated file storage
- Subdomain-based routing (e.g., `school-a.yourdomain.com`)
- Independent billing and subscription management

See [Multi-Tenancy Guide](docs/MULTI_TENANCY.md) for detailed implementation.

## Security Features

- NextAuth v5 authentication with multiple providers
- Two-factor authentication (TOTP + backup codes)
- Role-based access control (RBAC)
- Permission-based authorization
- CSRF protection on all forms
- Rate limiting on sensitive endpoints
- Input sanitization and validation
- File upload security with signature verification
- Comprehensive audit logging
- Session management with automatic timeout

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Email**: support@sikshamitra.com

## License

[MIT License](LICENSE)

## Acknowledgments

Built with modern web technologies and best practices for educational institutions.

---

**Version**: 2.0.0  
**Last Updated**: February 2026
