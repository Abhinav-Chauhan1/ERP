# 🚀 Quick Start - Production Deployment

**Time Required:** 2-4 hours  
**Difficulty:** Intermediate  
**Prerequisites:** Node.js, Git, Database provider account

---

## 5-Minute Overview

Your SikshaMitra ERP is **code-complete** and ready for production. Here's what you need to do:

1. ✅ **Code is ready** - All fixes applied, builds successfully
2. ⏳ **Configure environment** - Set up production variables
3. ⏳ **Set up database** - Create and migrate production database
4. ⏳ **Configure services** - Set up R2, payments, email, etc.
5. ⏳ **Test everything** - Run comprehensive tests
6. ⏳ **Deploy** - Push to production
7. ⏳ **Monitor** - Set up monitoring and alerts

---

## Step 1: Verify Code (5 minutes)

```bash
# Check everything is ready
npm run verify:production

# Expected output:
# ✅ Security configuration
# ✅ Environment variables (template check)
# ✅ Database schema
# ✅ Documentation complete
```

**If any checks fail:** Fix issues before proceeding

---

## Step 2: Configure Environment (15 minutes)

```bash
# Copy template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

**Required variables:**
- `DATABASE_URL` - Your production database
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `AUTH_URL` - Your production domain
- `R2_*` - Cloudflare R2 credentials
- `CONFIG_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`
- `CSRF_SECRET` - Generate with: `openssl rand -base64 32`

**See:** `.env.production.template` for complete list

---

## Step 3: Set Up Database (20 minutes)

```bash
# 1. Create database at Neon/Supabase/Railway

# 2. Set DATABASE_URL
export DATABASE_URL="your_production_database_url"

# 3. Run migrations
npx prisma migrate deploy

# 4. Seed initial data
npm run db:seed

# 5. Create super admin
npx tsx scripts/create-super-admin.ts
```

**Save super admin credentials securely!**

---

## Step 4: Configure Services (30-60 minutes)

### Cloudflare R2 (Required)
1. Go to https://dash.cloudflare.com
2. Create R2 bucket
3. Generate API token
4. Configure CORS
5. Add credentials to `.env.production`

### Razorpay (If using payments)
1. Go to https://dashboard.razorpay.com
2. Switch to LIVE mode
3. Generate API keys
4. Set up webhook
5. Add credentials to `.env.production`

### Resend (If using email)
1. Go to https://resend.com
2. Create API key
3. Verify domain
4. Add credentials to `.env.production`

### Sentry (Recommended)
1. Go to https://sentry.io
2. Create project
3. Copy DSN
4. Add to `.env.production`

**See:** `DEPLOY_NOW.md` Step 3 for detailed instructions

---

## Step 5: Test (30 minutes)

### Critical Tests (MUST PASS)

```bash
# 1. Build test
npm run build
# Expected: ✓ Compiled successfully

# 2. Test suite
npm test
# Expected: All tests pass
```

### Manual Tests

Use `TESTING_CHECKLIST.md` for:
- [ ] Login/logout
- [ ] File upload (R2 authentication)
- [ ] Payment flow (if configured)
- [ ] Multi-school isolation
- [ ] Student-parent association

**All critical tests must pass before deployment!**

---

## Step 6: Deploy (15 minutes)

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
# Option A: Via CLI
vercel env add AUTH_SECRET production

# Option B: Via dashboard
# Go to vercel.com > Project > Settings > Environment Variables

# 5. Deploy
vercel --prod
```

**Deployment time:** 2-5 minutes

---

## Step 7: Verify Deployment (15 minutes)

### Immediate Checks (Within 5 minutes)

```bash
# 1. Site is up
curl https://your-domain.com
# Expected: 200 OK

# 2. Login works
# Go to: https://your-domain.com/login
# Login with super admin credentials

# 3. Dashboard loads
# Verify you can see the dashboard
```

### Critical Tests (Within 15 minutes)

- [ ] Upload a file (test R2)
- [ ] Create a test record
- [ ] Check error logs: `vercel logs`
- [ ] Test payment (if configured)

**If any test fails:** Check `DEPLOY_NOW.md` troubleshooting section

---

## Step 8: Set Up Monitoring (20 minutes)

### Uptime Monitoring (Free)

1. Go to https://uptimerobot.com
2. Add monitor for your domain
3. Set check interval: 5 minutes
4. Add alert email

### Error Monitoring (If Sentry configured)

1. Go to Sentry dashboard
2. Verify errors are being captured
3. Set up alert rules
4. Add notification channels

### Performance Monitoring

1. Go to Vercel dashboard
2. Enable Analytics
3. Check performance metrics
4. Set up alerts

**See:** `MONITORING_MAINTENANCE.md` for detailed setup

---

## Step 9: Monitor First 24 Hours

### Hour 1
- [ ] Check error logs
- [ ] Verify all services working
- [ ] Test critical user flows
- [ ] Monitor performance

### Hour 4
- [ ] Review error rate (should be < 1%)
- [ ] Check database performance
- [ ] Verify backups working
- [ ] Review user feedback

### Hour 24
- [ ] Comprehensive health check
- [ ] Review analytics
- [ ] Document any issues
- [ ] Plan fixes if needed

**See:** `MONITORING_MAINTENANCE.md` for daily checklist

---

## Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run build

# Check logs
cat .next/build-manifest.json
```

### Database Connection Fails
```bash
# Test connection
npx prisma db pull

# Check connection string format
echo $DATABASE_URL
```

### Deployment Fails
```bash
# Check Vercel logs
vercel logs

# Check environment variables
vercel env ls
```

### R2 Files Not Accessible
```bash
# Test R2 setup
npm run test:r2

# Check R2 credentials
# Verify CORS configuration
```

**See:** `DEPLOY_NOW.md` for complete troubleshooting guide

---

## Success Checklist

- [ ] Code verified with `npm run verify:production`
- [ ] Environment variables configured
- [ ] Database set up and migrated
- [ ] External services configured
- [ ] All critical tests pass
- [ ] Deployed to production
- [ ] Post-deployment tests pass
- [ ] Monitoring configured
- [ ] No critical errors in logs
- [ ] Performance within targets

**All checked?** Congratulations! 🎉 Your app is live!

---

## Next Steps

### Immediate
- Monitor for first 24 hours
- Address any issues
- Document learnings

### Short-term
- Train team (use `docs/USER_GUIDES.md`)
- Set up regular backups
- Optimize performance

### Long-term
- Plan feature iterations
- Review analytics
- Gather user feedback

---

## Documentation Quick Links

**Start Here:**
- `LAUNCH_READINESS_SUMMARY.md` - Complete overview

**Deployment:**
- `DEPLOY_NOW.md` - Detailed deployment guide
- `.env.production.template` - Configuration template

**Testing:**
- `TESTING_CHECKLIST.md` - Comprehensive testing

**Operations:**
- `MONITORING_MAINTENANCE.md` - Daily operations

**Users:**
- `docs/USER_GUIDES.md` - All user guides

---

## Support

**Automated Verification:**
```bash
npm run verify:production
```

**Documentation:**
- All guides in project root and `docs/` folder

**Emergency:**
- Check `MONITORING_MAINTENANCE.md` for incident response

---

## Time Estimates

| Task | Time | Can Skip? |
|------|------|-----------|
| Verify code | 5 min | No |
| Configure environment | 15 min | No |
| Set up database | 20 min | No |
| Configure services | 30-60 min | Some optional |
| Test | 30 min | No |
| Deploy | 15 min | No |
| Verify deployment | 15 min | No |
| Set up monitoring | 20 min | Recommended |
| **Total** | **2-4 hours** | |

---

## Ready to Deploy?

1. **Read this guide** ✅
2. **Run:** `npm run verify:production`
3. **Follow:** `DEPLOY_NOW.md`
4. **Deploy!** 🚀

**Questions?** Check the documentation or run verification scripts.

**Good luck! 🎉**

---

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Status:** Ready for Production
