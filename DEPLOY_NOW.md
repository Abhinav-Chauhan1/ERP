# 🚀 Deploy to Production - Step by Step Guide

**Project:** SikshaMitra ERP
**Version:** 1.0
**Date:** February 15, 2026

This guide walks you through deploying SikshaMitra ERP to production.

---

## Prerequisites

Before you begin:

- [ ] All code changes committed to git
- [ ] Production environment variables prepared
- [ ] Database created and accessible
- [ ] External services configured (R2, Razorpay, etc.)
- [ ] Team notified of deployment window

---

## Step 1: Pre-Deployment Verification

### 1.1 Run Production Readiness Check

```bash
# Run automated verification
npm run verify:production

# This checks:
# - Environment variables
# - Database connectivity
# - External services configuration
# - Security settings
# - Documentation completeness
```

**Expected Output:** ✅ All critical checks pass

**If checks fail:** Fix issues before proceeding

---

### 1.2 Verify Build

```bash
# Clean build
rm -rf .next
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
```

**Build Time:** ~30-60 seconds

**If build fails:** Fix TypeScript/build errors before proceeding

---

### 1.3 Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:security
npm run test:integration
```

**Expected:** All tests pass

---

## Step 2: Database Setup

### 2.1 Create Production Database

**Option A: Neon (Recommended)**
```bash
# 1. Go to https://neon.tech
# 2. Create new project
# 3. Copy connection string
# 4. Add to environment variables
```

**Option B: Supabase**
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Get connection string from Settings > Database
# 4. Add to environment variables
```

**Option C: Railway**
```bash
# 1. Go to https://railway.app
# 2. Create PostgreSQL service
# 3. Copy connection string
# 4. Add to environment variables
```

---

### 2.2 Run Migrations

```bash
# Set production database URL
export DATABASE_URL="your_production_database_url"

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

**Expected:** All migrations applied successfully

---

### 2.3 Seed Initial Data

```bash
# Seed essential data (permissions, roles, etc.)
npm run db:seed

# Or run specific seeds
npx tsx prisma/seed-permissions.ts
npx tsx prisma/seed-subscription-plans.ts
```

---

### 2.4 Create Super Admin

```bash
# Create super admin account
npx tsx scripts/create-super-admin.ts

# Follow prompts:
# - Email: your-email@domain.com
# - Password: (strong password)
# - Name: Your Name
```

**Save credentials securely!**

---

## Step 3: Configure External Services

### 3.1 Cloudflare R2 Storage

```bash
# 1. Go to https://dash.cloudflare.com
# 2. Navigate to R2 Object Storage
# 3. Create bucket: "your-app-production"
# 4. Generate API token with R2 permissions
# 5. Configure CORS:
```

**CORS Configuration:**
```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Test R2:**
```bash
npm run test:r2
```

---

### 3.2 Razorpay Payment Gateway

```bash
# 1. Go to https://dashboard.razorpay.com
# 2. Switch to LIVE mode (top-left toggle)
# 3. Go to Settings > API Keys
# 4. Generate Live API Keys
# 5. Go to Settings > Webhooks
# 6. Add webhook URL: https://your-domain.com/api/payments/webhook
# 7. Select events: payment.captured, payment.failed
# 8. Copy webhook secret
```

**Test Payment (in test mode first):**
```bash
# Use Razorpay test cards
# Card: 4111 1111 1111 1111
# CVV: Any 3 digits
# Expiry: Any future date
```

---

### 3.3 Email Service (Resend)

```bash
# 1. Go to https://resend.com
# 2. Create API key
# 3. Add domain: your-domain.com
# 4. Verify domain (add DNS records)
# 5. Test email:
```

**Test Email:**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@your-domain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test email from production</p>"
  }'
```

---

### 3.4 SMS Service (MSG91)

```bash
# 1. Go to https://msg91.com
# 2. Get API key from Settings
# 3. Get Sender ID approved
# 4. Test SMS:
```

**Test SMS:**
```bash
curl -X POST https://api.msg91.com/api/v5/flow/ \
  -H "authkey: YOUR_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "YOURAPP",
    "short_url": "0",
    "mobiles": "91XXXXXXXXXX",
    "message": "Test SMS from production"
  }'
```

---

### 3.5 Sentry Error Monitoring (Optional but Recommended)

```bash
# 1. Go to https://sentry.io
# 2. Create new project (Next.js)
# 3. Copy DSN
# 4. Add to environment variables
# 5. Test error:
```

**Test Sentry:**
```javascript
// In browser console after deployment
throw new Error("Test Sentry Integration");
```

---

## Step 4: Configure Environment Variables

### 4.1 Copy Template

```bash
# Copy production template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

---

### 4.2 Required Variables Checklist

```bash
# Authentication
[ ] AUTH_SECRET (32+ chars, unique)
[ ] AUTH_URL (https://your-domain.com)
[ ] AUTH_TRUST_HOST=true

# Database
[ ] DATABASE_URL (production database)

# Domain
[ ] ROOT_DOMAIN (your-domain.com)
[ ] NEXT_PUBLIC_ROOT_DOMAIN (your-domain.com)

# R2 Storage
[ ] R2_ACCOUNT_ID
[ ] R2_ACCESS_KEY_ID
[ ] R2_SECRET_ACCESS_KEY
[ ] R2_BUCKET_NAME

# Security
[ ] CONFIG_ENCRYPTION_KEY (32 bytes hex)
[ ] CSRF_SECRET (32+ chars)
[ ] CRON_SECRET (32+ chars)

# Payment (if using)
[ ] RAZORPAY_KEY_ID (LIVE key)
[ ] RAZORPAY_KEY_SECRET
[ ] RAZORPAY_WEBHOOK_SECRET

# Email (if using)
[ ] RESEND_API_KEY
[ ] EMAIL_FROM

# SMS (if using)
[ ] MSG91_AUTH_KEY
[ ] MSG91_SENDER_ID
```

---

## Step 5: Deploy to Vercel (Recommended)

### 5.1 Install Vercel CLI

```bash
npm install -g vercel
```

---

### 5.2 Login to Vercel

```bash
vercel login
```

---

### 5.3 Link Project

```bash
# In project directory
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account/team
# - Link to existing project? No (first time) / Yes (subsequent)
# - Project name: sikshamitra-erp
```

---

### 5.4 Set Environment Variables

**Option A: Via CLI**
```bash
# Set each variable
vercel env add AUTH_SECRET production
# Paste value when prompted

# Or bulk import
vercel env pull .env.production
```

**Option B: Via Dashboard**
```bash
# 1. Go to https://vercel.com/dashboard
# 2. Select your project
# 3. Go to Settings > Environment Variables
# 4. Add each variable
# 5. Select "Production" environment
# 6. Mark sensitive variables as "Sensitive"
```

---

### 5.5 Deploy to Production

```bash
# Deploy to production
vercel --prod

# Expected output:
# ✓ Deployment ready
# ✓ Inspect: https://vercel.com/...
# ✓ Production: https://your-domain.com
```

**Deployment Time:** ~2-5 minutes

---

### 5.6 Configure Custom Domain

```bash
# Add domain via CLI
vercel domains add your-domain.com

# Or via dashboard:
# 1. Go to Project Settings > Domains
# 2. Add your-domain.com
# 3. Follow DNS configuration instructions
# 4. Wait for DNS propagation (5-30 minutes)
```

**DNS Records:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Step 6: Post-Deployment Verification

### 6.1 Health Check (Within 5 minutes)

```bash
# Check if site is up
curl https://your-domain.com

# Check API health
curl https://your-domain.com/api/health

# Expected: 200 OK
```

---

### 6.2 Critical Tests (Within 15 minutes)

```bash
# 1. Login Test
# - Go to https://your-domain.com/login
# - Login with super admin credentials
# - Verify redirect to dashboard

# 2. Database Test
# - Check if data loads
# - Create test record
# - Verify saved

# 3. File Upload Test
# - Upload a file
# - Verify stored in R2
# - Download file
# - Verify integrity

# 4. Payment Test (if configured)
# - Initiate test payment
# - Complete payment
# - Verify webhook received
# - Check payment record created
```

---

### 6.3 Monitor Errors (Within 30 minutes)

```bash
# Check Vercel logs
vercel logs --follow

# Check Sentry (if configured)
# Go to https://sentry.io/your-org/your-project

# Check for:
# - 500 errors
# - Database connection errors
# - External service errors
# - Authentication errors
```

---

### 6.4 Performance Check (Within 1 hour)

```bash
# Check page load times
# Use browser DevTools Network tab

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/students

# Create curl-format.txt:
time_total: %{time_total}s

# Expected: < 3s for pages, < 500ms for APIs
```

---

## Step 7: Configure Monitoring

### 7.1 Set Up Uptime Monitoring

**UptimeRobot (Free):**
```bash
# 1. Go to https://uptimerobot.com
# 2. Add new monitor
# 3. Type: HTTPS
# 4. URL: https://your-domain.com
# 5. Interval: 5 minutes
# 6. Add alert contacts
```

---

### 7.2 Configure Sentry Alerts

```bash
# 1. Go to Sentry project
# 2. Settings > Alerts
# 3. Create alert rules:
#    - Error rate > 1%
#    - New error first seen
#    - Performance degradation
# 4. Add notification channels (email, Slack)
```

---

### 7.3 Set Up Vercel Notifications

```bash
# 1. Go to Vercel project settings
# 2. Notifications
# 3. Enable:
#    - Deployment failures
#    - Function errors
#    - Performance alerts
# 4. Add Slack webhook (optional)
```

---

## Step 8: Backup Configuration

### 8.1 Database Backups

**Automated (Recommended):**
```bash
# If using Neon/Supabase, enable automatic backups in dashboard

# Or set up cron job:
# Add to Vercel Cron Jobs or use external service
```

**Manual Backup:**
```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to R2 or S3
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

---

### 8.2 Environment Variables Backup

```bash
# Export environment variables
vercel env pull .env.production.backup

# Encrypt and store securely
# Use 1Password, LastPass, or AWS Secrets Manager
```

---

## Step 9: Team Notification

### 9.1 Notify Stakeholders

**Email Template:**
```
Subject: SikshaMitra ERP - Production Deployment Complete

Hi Team,

SikshaMitra ERP has been successfully deployed to production.

Production URL: https://your-domain.com
Deployment Time: [TIME]
Version: 1.0

Super Admin Access:
- URL: https://your-domain.com/super-admin
- Credentials: [Sent separately]

Monitoring:
- Uptime: https://uptimerobot.com/dashboard
- Errors: https://sentry.io/your-org/your-project
- Logs: https://vercel.com/your-team/your-project/logs

Next Steps:
1. Test all critical functionality
2. Monitor for first 24 hours
3. Report any issues to #production-alerts

Documentation:
- User Guide: [LINK]
- Admin Guide: [LINK]
- Support: support@your-domain.com

Thanks,
DevOps Team
```

---

## Step 10: Post-Launch Monitoring

### 10.1 First 24 Hours Checklist

**Hour 1:**
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all services operational
- [ ] Test critical user flows

**Hour 4:**
- [ ] Review error rate (should be < 1%)
- [ ] Check database performance
- [ ] Verify backup completed
- [ ] Review user feedback

**Hour 12:**
- [ ] Full system health check
- [ ] Review analytics
- [ ] Check resource usage
- [ ] Update team

**Hour 24:**
- [ ] Comprehensive review
- [ ] Document any issues
- [ ] Plan fixes if needed
- [ ] Celebrate success! 🎉

---

## Rollback Procedure

If critical issues occur:

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [DEPLOYMENT_URL]

# Or via dashboard:
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "..." > "Promote to Production"
```

---

### Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD.sql

# Or use provider's restore feature
```

---

## Troubleshooting

### Issue: Deployment Fails

**Check:**
- Build logs in Vercel
- Environment variables set correctly
- No TypeScript errors
- Dependencies installed

**Fix:**
```bash
# Local test
npm run build

# Check logs
vercel logs
```

---

### Issue: Database Connection Fails

**Check:**
- DATABASE_URL correct
- Database accessible from Vercel
- Connection pool settings
- Firewall rules

**Fix:**
```bash
# Test connection
npx prisma db pull

# Check connection string format
```

---

### Issue: R2 Files Not Accessible

**Check:**
- R2 credentials correct
- CORS configured
- Bucket exists
- Authentication middleware enabled

**Fix:**
```bash
# Test R2 connection
npm run test:r2

# Check R2 dashboard for errors
```

---

### Issue: Payments Not Working

**Check:**
- Using LIVE keys (not test)
- Webhook URL correct
- Webhook secret matches
- Razorpay account activated

**Fix:**
```bash
# Check webhook logs in Razorpay dashboard
# Verify webhook URL: https://your-domain.com/api/payments/webhook
```

---

## Success Criteria

Deployment is successful when:

- ✅ Site accessible at production URL
- ✅ All critical tests pass
- ✅ No errors in logs (first hour)
- ✅ Performance within targets
- ✅ All services operational
- ✅ Monitoring configured
- ✅ Backups working
- ✅ Team notified

---

## Next Steps

After successful deployment:

1. **Monitor** - Watch for 24-48 hours
2. **Document** - Record any issues and fixes
3. **Optimize** - Identify performance improvements
4. **Plan** - Schedule next iteration
5. **Celebrate** - You did it! 🎉

---

## Support Resources

**Documentation:**
- Launch Checklist: `LAUNCH_CHECKLIST.md`
- Testing Guide: `TESTING_CHECKLIST.md`
- Monitoring Guide: `MONITORING_MAINTENANCE.md`
- Production Summary: `PRODUCTION_READY_SUMMARY.md`

**Tools:**
- Vercel Dashboard: https://vercel.com/dashboard
- Sentry: https://sentry.io
- Uptime Monitor: https://uptimerobot.com

**Emergency Contacts:**
- On-Call: [PHONE]
- Tech Lead: [PHONE]
- DevOps: [PHONE]

---

**Version:** 1.0
**Last Updated:** February 15, 2026
**Prepared By:** DevOps Team

**Ready to deploy? Let's go! 🚀**
