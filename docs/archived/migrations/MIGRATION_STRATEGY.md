# SikshaMitra ERP - Migration Strategy

## Overview
This document consolidates all migration guides and strategies for the SikshaMitra ERP system. It replaces multiple individual migration documents for better maintainability.

## Migration Types

### 1. Database Schema Migrations
- **Prisma Migrations**: Automated schema changes using Prisma migrate
- **Data Migrations**: Custom scripts for data transformation
- **Index Migrations**: Performance optimization migrations

### 2. Feature Migrations
- **Enhanced Syllabus**: Migration to new syllabus system
- **Fee Structure**: Migration to enhanced fee management
- **Multi-School**: Migration to multi-tenant architecture
- **Authentication**: Migration to unified auth system

### 3. Infrastructure Migrations
- **Subdomain System**: Migration to custom domain support
- **File Storage**: Migration to Cloudinary
- **Session Management**: Migration to enhanced session handling

## Quick Start Guide

### Prerequisites
1. **Backup Database**: Always create a full backup before migration
2. **Environment Setup**: Ensure all environment variables are configured
3. **Dependencies**: Install all required packages
4. **Testing Environment**: Set up staging environment for testing

### Basic Migration Process
```bash
# 1. Backup current database
npm run backup

# 2. Run database migrations
npx prisma migrate deploy

# 3. Run data migrations (if needed)
npm run migrate:data

# 4. Verify migration
npm run verify:migration

# 5. Update application
npm run build
npm run start
```

## Specific Migration Guides

### Enhanced Syllabus Migration
**Status**: ✅ Complete
- Migrates from basic syllabus to enhanced module-based system
- Includes document management and progress tracking
- **CLI Tool**: `scripts/migrate-syllabus-cli.ts`

### Fee Structure Migration
**Status**: ✅ Complete
- Migrates to new fee structure with class-based pricing
- Supports complex fee calculations and discounts
- **Migration Script**: `scripts/migrate-fee-structure-classes.ts`

### Multi-School Migration
**Status**: ✅ Complete
- Migrates single-tenant to multi-tenant architecture
- Adds school isolation and data segregation
- **Migration Script**: `scripts/migrate-subdomain-schema.ts`

### Alumni Import Migration
**Status**: ✅ Complete
- Imports historical alumni data
- Handles data validation and cleanup
- **Import Tool**: `scripts/import-historical-alumni.ts`

## Migration CLI Tools

### Available Commands
```bash
# Syllabus migration
npm run migrate:syllabus

# Fee structure migration
npm run migrate:fees

# Multi-school setup
npm run migrate:multi-school

# Alumni import
npm run import:alumni

# General migration verification
npm run verify:all
```

### Custom Migration Scripts
Located in `scripts/` directory:
- `migrate-syllabus-to-modules.ts` - Syllabus system migration
- `migrate-fee-structure-classes.ts` - Fee structure migration
- `migrate-subdomain-schema.ts` - Multi-tenant migration
- `import-historical-alumni.ts` - Alumni data import

## Deployment Checklist

### Pre-Migration
- [ ] Create full database backup
- [ ] Document current system state
- [ ] Prepare rollback plan
- [ ] Set up monitoring
- [ ] Notify stakeholders

### During Migration
- [ ] Run in maintenance mode
- [ ] Execute migration scripts in order
- [ ] Monitor for errors
- [ ] Verify data integrity
- [ ] Test critical functionality

### Post-Migration
- [ ] Verify all features work
- [ ] Check performance metrics
- [ ] Update documentation
- [ ] Train users on changes
- [ ] Monitor system stability

## Rollback Procedures

### Database Rollback
```bash
# Restore from backup
npm run restore:backup [backup-file]

# Rollback specific migration
npx prisma migrate reset

# Verify rollback
npm run verify:rollback
```

### Application Rollback
```bash
# Deploy previous version
git checkout [previous-tag]
npm run build
npm run deploy

# Verify functionality
npm run test:integration
```

## User Guides

### For Administrators
- **School Setup**: How to configure new schools after multi-tenant migration
- **User Management**: Managing users across multiple schools
- **Data Verification**: Checking data integrity after migration

### For Teachers
- **Syllabus Changes**: Understanding the new syllabus system
- **Grade Management**: Using the enhanced grading features
- **Report Generation**: New reporting capabilities

### For Parents/Students
- **Login Changes**: New unified login process
- **Dashboard Updates**: Interface changes and new features
- **Mobile Access**: Updated mobile experience

## Troubleshooting

### Common Issues
1. **Migration Timeout**: Increase timeout settings for large datasets
2. **Data Conflicts**: Resolve duplicate or conflicting data
3. **Permission Issues**: Update user permissions after migration
4. **Performance Issues**: Rebuild indexes and optimize queries

### Support Resources
- **Documentation**: Comprehensive guides in `docs/` directory
- **Scripts**: Automated tools in `scripts/` directory
- **Testing**: Verification scripts for each migration type
- **Monitoring**: Health checks and performance monitoring

## Historical References

This document consolidates information from:
- `MIGRATION_GUIDE.md` - General migration procedures
- `MIGRATION_QUICK_START.md` - Quick start instructions
- `MIGRATION_SUMMARY.md` - Migration overview
- `MIGRATION_USER_GUIDE.md` - User-facing documentation
- `MIGRATION_DEPLOYMENT_CHECKLIST.md` - Deployment procedures
- `MIGRATION_CLI_GUIDE.md` - CLI tool documentation
- `MIGRATION_CLI_QUICK_REFERENCE.md` - CLI reference

## Next Steps

1. **Monitoring**: Continue monitoring system performance post-migration
2. **Optimization**: Identify and implement performance improvements
3. **Documentation**: Keep migration procedures updated
4. **Training**: Provide ongoing user training and support

---

*Last Updated: January 29, 2025*
*This document replaces multiple individual migration guides for better maintainability*