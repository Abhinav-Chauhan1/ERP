# Production Monitoring & Maintenance Guide

**Purpose:** Ensure SikshaMitra ERP runs smoothly in production
**Audience:** DevOps, System Administrators, Tech Leads
**Updated:** February 15, 2026

---

## 📊 Monitoring Strategy

### What to Monitor

| Category | Metrics | Tools | Frequency |
|----------|---------|-------|-----------|
| **Errors** | Error rate, Error types | Sentry, Logs | Real-time |
| **Performance** | Response time, Throughput | Vercel Analytics | Hourly |
| **Database** | Query time, Connections | PostgreSQL logs | Daily |
| **Storage** | R2 usage, Bandwidth | Cloudflare dashboard | Weekly |
| **Payments** | Success rate, Failures | Razorpay dashboard | Daily |
| **Security** | Failed logins, Suspicious activity | Audit logs | Daily |

---

## 🔍 Daily Monitoring Checklist

### Morning Check (9:00 AM)

```bash
# 1. Check error logs (last 24 hours)
[ ] Sentry dashboard - Any new errors?
[ ] Server logs - Any warnings?
[ ] Database logs - Any slow queries?

# 2. Check key metrics
[ ] System uptime - Should be 99.9%+
[ ] API response time - Should be < 500ms
[ ] Database connections - Should be < 80% of max

# 3. Check critical services
[ ] Database - Is it responsive?
[ ] R2 Storage - Is upload/download working?
[ ] Razorpay - Any failed payments?
[ ] Email service - Are emails being sent?
[ ] SMS service - Are SMS being delivered?

# 4. Review yesterday's activities
[ ] Number of logins - _____ (expected: _____)
[ ] Number of payments - _____ (expected: _____)
[ ] Number of file uploads - _____ (expected: _____)
[ ] Any unusual patterns?

# 5. Check for scheduled tasks
[ ] Backups completed successfully?
[ ] Reports generated?
[ ] Notifications sent?
```

**Time Required:** 15-20 minutes
**Escalate If:** Error rate > 1%, Response time > 2s, Service down

---

## 📈 Key Performance Indicators (KPIs)

### Availability

```
Target: 99.9% uptime (< 45 minutes downtime per month)

How to measure:
- Vercel deployment status
- Uptime monitoring service (UptimeRobot, Pingdom)
- User-reported issues

Current: _____% (Last 30 days)
```

### Performance

```
Target Metrics:
- Page Load Time: < 3 seconds (p95)
- API Response Time: < 500ms (p95)
- Database Query Time: < 100ms (p95)

How to measure:
- Vercel Analytics
- Application logs
- Database query logs

Current:
- Page Load: _____ seconds
- API Response: _____ ms
- DB Query: _____ ms
```

### Reliability

```
Target Metrics:
- Error Rate: < 1%
- Payment Success Rate: > 95%
- Email Delivery Rate: > 98%

How to measure:
- Sentry error tracking
- Razorpay dashboard
- Email service logs

Current:
- Error Rate: _____%
- Payment Success: _____%
- Email Delivery: _____%
```

### Security

```
Target Metrics:
- Failed Login Attempts: < 5 per user per day
- Suspicious Activities: 0
- Unauthorized Access Attempts: 0

How to measure:
- Audit logs
- Authentication logs
- R2 access logs

Current:
- Failed Logins: _____
- Suspicious: _____
- Unauthorized: _____
```

---

## 🚨 Alerts & Escalation

### Critical Alerts (Immediate Response)

| Alert | Threshold | Action | Who |
|-------|-----------|--------|-----|
| **System Down** | Uptime < 95% | Investigate immediately | DevOps Lead |
| **Database Down** | Connection failed | Restore from backup | DBA |
| **Payment Failures** | > 10 in 1 hour | Check Razorpay status | Tech Lead |
| **Security Breach** | Unauthorized access | Lock system, investigate | Security Team |
| **Data Loss** | Backup failed | Run manual backup | DevOps |

### High Priority Alerts (Respond within 1 hour)

| Alert | Threshold | Action | Who |
|-------|-----------|--------|-----|
| **High Error Rate** | > 5% | Review Sentry logs | Backend Dev |
| **Slow Performance** | Response time > 2s | Optimize queries | Backend Dev |
| **Storage Full** | > 90% capacity | Clean up or upgrade | DevOps |
| **Failed Emails** | > 50 in 1 day | Check email service | Backend Dev |

### Medium Priority Alerts (Respond within 4 hours)

| Alert | Threshold | Action | Who |
|-------|-----------|--------|-----|
| **High CPU** | > 80% for 15 min | Investigate cause | DevOps |
| **Memory Usage** | > 85% | Check for leaks | Backend Dev |
| **API Rate Limit** | > 80% of limit | Review usage patterns | Backend Dev |

---

## 📱 Alert Channels

### Setup

```bash
# 1. Sentry Alerts
- Go to Sentry dashboard
- Settings > Alerts
- Create alert rules:
  * Error rate > 1%
  * New error first seen
  * Critical error threshold

# 2. Vercel Alerts
- Vercel dashboard > Settings
- Enable notifications for:
  * Deployment failures
  * Function errors
  * Performance degradation

# 3. Database Alerts
- PostgreSQL monitoring
- Set up alerts for:
  * Connection pool exhaustion
  * Slow queries (> 1s)
  * Disk usage > 80%

# 4. Uptime Monitoring
- Use UptimeRobot or Pingdom
- Monitor endpoints:
  * https://your-domain.com/api/health
  * https://your-domain.com/login
- Alert if down for > 2 minutes
```

### Contact List

```
Critical Issues:
- On-Call Dev: +1-XXX-XXX-XXXX
- DevOps Lead: +1-XXX-XXX-XXXX
- Tech Lead: +1-XXX-XXX-XXXX

Escalation Path:
1. On-Call Dev (0-15 min)
2. Tech Lead (15-30 min)
3. CTO (30+ min)

Slack Channels:
- #production-alerts
- #devops
- #engineering
```

---

## 🔧 Common Issues & Solutions

### Issue 1: High Error Rate

**Symptoms:**
- Sentry showing spike in errors
- Users reporting 500 errors
- Dashboard shows error rate > 1%

**Diagnosis:**
```bash
# Check Sentry dashboard
1. What type of errors?
2. Which endpoints affected?
3. Started when?

# Check server logs
vercel logs --follow

# Check database
# Look for connection errors, timeout errors
```

**Solutions:**
1. **If deployment issue:** Rollback to previous version
2. **If database issue:** Restart database, check connection pool
3. **If API issue:** Check third-party services (Razorpay, MSG91)
4. **If code bug:** Hotfix and deploy

**Escalate if:** Can't resolve in 15 minutes

---

### Issue 2: Slow Performance

**Symptoms:**
- Page load time > 3 seconds
- API response time > 1 second
- Users reporting slowness

**Diagnosis:**
```bash
# Check Vercel Analytics
- Which pages are slow?
- Which APIs are slow?

# Check database
- Are there slow queries?
- Is database CPU high?

# Check R2
- Are file operations slow?
- Is bandwidth saturated?
```

**Solutions:**
1. **Slow queries:** Add indexes, optimize queries
2. **High traffic:** Scale up resources
3. **Large files:** Implement caching, CDN
4. **Memory leak:** Restart services, fix leak

**Escalate if:** Performance < 50% of normal

---

### Issue 3: Payment Failures

**Symptoms:**
- Multiple payment failures
- Webhook not processing
- Users can't pay fees

**Diagnosis:**
```bash
# Check Razorpay dashboard
- Are payments being created?
- Are webhooks being received?
- Any errors in webhook logs?

# Check application logs
- Search for "payment webhook"
- Look for 500 errors in /api/payments/webhook

# Check database
- Are feePayment records being created?
- Check for missing schoolId errors
```

**Solutions:**
1. **Webhook issue:** Verify webhook URL in Razorpay
2. **SchoolId error:** Check logs, verify student exists
3. **Network issue:** Check Razorpay status page
4. **Database issue:** Check database connections

**Escalate if:** > 10 failures or affecting multiple schools

---

### Issue 4: Authentication Problems

**Symptoms:**
- Users can't login
- Session expired errors
- 401 errors on file access

**Diagnosis:**
```bash
# Check NextAuth
- Is NEXTAUTH_SECRET set?
- Is NEXTAUTH_URL correct?
- Are sessions being created?

# Check database
- Are User records accessible?
- Are Session records being created?

# Check R2 middleware
- Is authentication enabled?
- Are file access checks working?
```

**Solutions:**
1. **Session issues:** Clear sessions, regenerate secret
2. **Database issues:** Check User table, indexes
3. **R2 auth issues:** Verify middleware enabled
4. **Env variable issues:** Check production env vars

**Escalate if:** Affecting > 10% of users

---

## 📅 Maintenance Schedule

### Daily Tasks (Automated)

```bash
# 1. Database Backup (2:00 AM)
- Full backup to R2
- Retention: 7 days
- Verify backup integrity

# 2. Log Rotation (3:00 AM)
- Archive logs > 7 days
- Keep last 30 days
- Compress and store in R2

# 3. Cache Cleanup (4:00 AM)
- Clear expired cache entries
- Optimize cache storage
```

### Weekly Tasks (Manual)

```bash
Sunday, 10:00 AM:

[ ] Review error logs from past week
[ ] Check database performance metrics
[ ] Review slow queries and optimize
[ ] Update monitoring dashboards
[ ] Check storage usage (database, R2)
[ ] Review security audit logs
[ ] Test backup restoration (spot check)
[ ] Review and update documentation
```

**Time Required:** 1-2 hours

### Monthly Tasks (Manual)

```bash
First Monday, 10:00 AM:

[ ] Full security audit
[ ] Review and rotate secrets/tokens
[ ] Update dependencies (npm audit fix)
[ ] Performance optimization review
[ ] Cost optimization review
[ ] Disaster recovery drill
[ ] Review monitoring alerts (false positives?)
[ ] Update runbooks
[ ] Team training on new features
```

**Time Required:** 3-4 hours

### Quarterly Tasks (Planned)

```bash
Q1, Q2, Q3, Q4:

[ ] Major dependency updates
[ ] Security penetration testing
[ ] Full disaster recovery test
[ ] Capacity planning review
[ ] Architecture review
[ ] Technical debt assessment
[ ] Performance benchmarking
[ ] Infrastructure cost review
```

**Time Required:** 1-2 days

---

## 🔐 Security Monitoring

### What to Monitor

1. **Failed Login Attempts**
   ```sql
   -- Query to find suspicious login attempts
   SELECT userId, COUNT(*) as attempts, MAX(timestamp) as last_attempt
   FROM AuditLog
   WHERE action = 'LOGIN_FAILED'
   AND timestamp > NOW() - INTERVAL '1 day'
   GROUP BY userId
   HAVING COUNT(*) > 5
   ORDER BY attempts DESC;
   ```

2. **Unauthorized Access Attempts**
   ```sql
   -- Query to find 403 errors
   SELECT userId, resource, COUNT(*) as attempts
   FROM AuditLog
   WHERE action = 'ACCESS_DENIED'
   AND timestamp > NOW() - INTERVAL '1 day'
   GROUP BY userId, resource
   ORDER BY attempts DESC;
   ```

3. **Suspicious File Access**
   ```sql
   -- Query to find cross-school file access attempts
   SELECT userId, fileKey, COUNT(*) as attempts
   FROM AuditLog
   WHERE resource = 'FILE_ACCESS'
   AND details->>'allowed' = 'false'
   AND timestamp > NOW() - INTERVAL '1 day'
   GROUP BY userId, fileKey
   ORDER BY attempts DESC;
   ```

### Security Alerts

| Alert | Action | Severity |
|-------|--------|----------|
| 5+ failed logins | Lock account, notify user | Medium |
| Unauthorized access | Investigate immediately | High |
| SQL injection attempt | Block IP, investigate | Critical |
| Cross-school data access | Lock user, investigate | Critical |
| Unusual data export | Verify legitimacy | Medium |

---

## 💾 Backup & Recovery

### Backup Strategy

**What to Backup:**
1. PostgreSQL database (daily)
2. R2 uploaded files (incremental)
3. Environment variables (encrypted)
4. Configuration files
5. Audit logs

**Backup Schedule:**
```
Daily:   Full database backup (2:00 AM)
Weekly:  Full R2 file backup (Sunday 3:00 AM)
Monthly: Archive to long-term storage (1st of month)
```

**Retention:**
```
Daily backups:   7 days
Weekly backups:  4 weeks
Monthly backups: 12 months
```

### Recovery Procedures

#### Disaster Recovery: Database Loss

```bash
# 1. Get latest backup
aws s3 cp s3://backups/latest-backup.sql .

# 2. Restore database
psql $DATABASE_URL < latest-backup.sql

# 3. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM schools;"

# 4. Test application
curl https://your-domain.com/api/health

# 5. Notify team
# Send notification that system restored
```

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 24 hours

#### Disaster Recovery: Full System Loss

```bash
# 1. Provision new infrastructure
# Use infrastructure-as-code

# 2. Restore database
# Follow database recovery above

# 3. Restore R2 files
# Copy from backup bucket

# 4. Deploy application
vercel --prod

# 5. Update DNS
# Point to new deployment

# 6. Verify all services
# Run full test suite
```

**RTO:** 4 hours
**RPO:** 24 hours

---

## 📞 On-Call Runbook

### On-Call Responsibilities

**During On-Call (24/7):**
- Respond to alerts within 15 minutes
- Investigate and resolve critical issues
- Escalate if can't resolve within 30 minutes
- Document all incidents
- Update runbooks with learnings

**Handoff Procedure:**
1. Review open incidents
2. Check monitoring dashboards
3. Update incident notes
4. Brief incoming on-call
5. Confirm contact information

### Incident Response

**Step 1: Acknowledge (0-5 min)**
```bash
1. Acknowledge alert (Sentry, PagerDuty, etc.)
2. Check monitoring dashboards
3. Assess severity (P0-P4)
4. Post in #production-alerts Slack
```

**Step 2: Investigate (5-15 min)**
```bash
1. Check Sentry for errors
2. Check Vercel logs
3. Check database status
4. Check third-party services
5. Identify root cause
```

**Step 3: Mitigate (15-30 min)**
```bash
1. Apply hotfix or rollback
2. Verify fix resolves issue
3. Monitor for 5-10 minutes
4. Update stakeholders
```

**Step 4: Document (30-60 min)**
```bash
1. Create incident report
2. Document root cause
3. Document resolution
4. Add to runbook
5. Schedule postmortem if needed
```

### Incident Severity

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0** | Critical - System down | 15 min | Complete outage |
| **P1** | High - Major feature broken | 1 hour | Payments failing |
| **P2** | Medium - Minor feature broken | 4 hours | Slow performance |
| **P3** | Low - Cosmetic issue | 1 day | UI bug |
| **P4** | Trivial - Enhancement | 1 week | Feature request |

---

## 📚 Resources

### Documentation
- All changes: `PRODUCTION_READY_CHANGES.md`
- Testing guide: `TESTING_CHECKLIST.md`
- Deployment: `DEPLOY_NOW.md`
- Project review: `PROJECT_COMPREHENSIVE_REVIEW.md`

### Dashboards
- Sentry: https://sentry.io/your-org/your-project
- Vercel: https://vercel.com/your-team/your-project
- Razorpay: https://dashboard.razorpay.com/
- Cloudflare R2: https://dash.cloudflare.com/

### Tools
- Database: pgAdmin, TablePlus
- Monitoring: Sentry, Vercel Analytics
- Logs: Vercel Logs, CloudWatch
- Alerts: PagerDuty, Slack

---

**Last Updated:** February 15, 2026
**Next Review:** March 15, 2026
**Owner:** DevOps Team
