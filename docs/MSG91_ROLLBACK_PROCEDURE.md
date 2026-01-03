# MSG91 Rollback Procedure

## Overview

This document provides emergency rollback procedures for reverting from MSG91 to Twilio SMS service. Use this guide if you encounter critical issues with MSG91 in production.

## When to Rollback

Consider rollback if you experience:

1. **High Failure Rate**: >10% SMS delivery failures
2. **Service Outage**: MSG91 API is down for >30 minutes
3. **Critical Bug**: Discovered bug affecting SMS delivery
4. **Compliance Issues**: DLT template rejections affecting operations
5. **Cost Overruns**: Unexpected high costs from MSG91

## Emergency Rollback (Production)

### Time Required: 5-10 minutes

### Step 1: Disable MSG91 Feature Flag

**Option A: Via Environment Variable (Recommended)**

```bash
# Update .env file
USE_MSG91=false
```

**Option B: Via Server Environment (if using hosting platform)**

```bash
# Heroku
heroku config:set USE_MSG91=false -a your-app-name

# Vercel
vercel env add USE_MSG91 false production

# AWS Elastic Beanstalk
eb setenv USE_MSG91=false

# Railway
railway variables set USE_MSG91=false
```

### Step 2: Restart Application

```bash
# PM2
pm2 restart all

# Docker
docker-compose restart

# Kubernetes
kubectl rollout restart deployment/your-app-name

# Systemd
sudo systemctl restart your-app-name

# Manual
# Stop and start your Node.js process
```

### Step 3: Verify Rollback

**Check Provider:**

```bash
curl -X POST https://your-production-url.com/api/admin/check-sms-config \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "provider": "Twilio",
    "message": "SMS service is configured and ready to use (Provider: Twilio)"
  }
}
```

### Step 4: Send Test SMS

```bash
curl -X POST https://your-production-url.com/api/admin/send-sms \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "message": "Test SMS after rollback to Twilio"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "SM...",
    "status": "queued",
    "to": "+919876543210"
  }
}
```

### Step 5: Monitor for 1 Hour

Monitor the following:

1. **SMS Delivery Rate**: Should return to baseline
2. **Error Logs**: Check for any Twilio-related errors
3. **Response Times**: Verify API latency is normal
4. **User Reports**: Monitor support tickets

### Step 6: Notify Stakeholders

Send notification to:

1. Development team
2. Operations team
3. Management (if critical)
4. Support team

**Template Email:**

```
Subject: SMS Service Rolled Back to Twilio

Team,

We have rolled back SMS service from MSG91 to Twilio due to [REASON].

Rollback completed at: [TIMESTAMP]
Current provider: Twilio
Status: Operational

Action items:
1. Monitor SMS delivery for next 24 hours
2. Investigate MSG91 issues
3. Plan re-migration after issues resolved

[Your Name]
```

## Planned Rollback (Non-Emergency)

### Time Required: 1-2 hours

Use this procedure for planned rollback during maintenance window.

### Step 1: Schedule Maintenance Window

1. Notify users of maintenance window
2. Choose low-traffic time (e.g., 2 AM - 4 AM)
3. Prepare rollback team

### Step 2: Backup Current Configuration

```bash
# Backup environment variables
cp .env .env.backup.msg91.$(date +%Y%m%d_%H%M%S)

# Backup database (if needed)
pg_dump your_database > backup_before_rollback.sql

# Document current state
echo "Rollback initiated at $(date)" >> rollback_log.txt
echo "Reason: [YOUR REASON]" >> rollback_log.txt
```

### Step 3: Update Environment Variables

```bash
# Update .env
USE_MSG91=false

# Verify Twilio credentials are still present
grep TWILIO .env
```

### Step 4: Deploy Changes

```bash
# Build application
npm run build

# Run tests
npm test

# Deploy
# Use your deployment process
```

### Step 5: Verify Rollback

Run comprehensive tests:

```bash
# Test single SMS
npm run test:sms:single

# Test bulk SMS
npm run test:sms:bulk

# Test delivery status
npm run test:sms:status
```

### Step 6: Update Documentation

1. Update internal wiki
2. Update runbook
3. Document lessons learned
4. Update migration timeline

### Step 7: Post-Rollback Review

Schedule meeting to discuss:

1. What went wrong with MSG91?
2. What can be improved?
3. When to retry migration?
4. What additional testing is needed?

## Rollback Verification Checklist

Use this checklist to verify successful rollback:

- [ ] `USE_MSG91=false` in environment
- [ ] Application restarted successfully
- [ ] Provider shows as "Twilio" in config check
- [ ] Test SMS sent successfully
- [ ] Test SMS delivered successfully
- [ ] Bulk SMS working
- [ ] Delivery status tracking working
- [ ] No errors in application logs
- [ ] No errors in Twilio dashboard
- [ ] SMS delivery rate normal
- [ ] Response times normal
- [ ] Stakeholders notified
- [ ] Documentation updated

## Common Rollback Issues

### Issue: "Twilio credentials not configured"

**Cause**: Twilio environment variables were removed

**Solution**:
```bash
# Restore from backup
cp .env.backup.YYYYMMDD .env

# Or set manually
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

### Issue: Application won't restart

**Cause**: Configuration error or syntax error

**Solution**:
```bash
# Check logs
pm2 logs

# Check environment variables
printenv | grep TWILIO
printenv | grep USE_MSG91

# Validate .env file
cat .env | grep -v '^#' | grep -v '^$'
```

### Issue: SMS still failing after rollback

**Cause**: Twilio account issue or credentials expired

**Solution**:
1. Log in to Twilio dashboard
2. Verify account is active
3. Check account balance
4. Verify phone number is active
5. Regenerate auth token if needed

### Issue: Different error messages

**Cause**: Code still trying to use MSG91

**Solution**:
```bash
# Verify feature flag
echo $USE_MSG91  # Should be "false"

# Clear application cache
npm run cache:clear

# Restart with clean state
pm2 delete all
pm2 start ecosystem.config.js
```

## Rollback Decision Matrix

| Severity | Failure Rate | Action | Timeline |
|----------|--------------|--------|----------|
| Critical | >50% | Immediate rollback | 5 minutes |
| High | 25-50% | Emergency rollback | 15 minutes |
| Medium | 10-25% | Planned rollback | 1-2 hours |
| Low | <10% | Monitor and fix | 24-48 hours |

## Post-Rollback Actions

### Immediate (0-24 hours)

1. Monitor SMS delivery rates
2. Check error logs every hour
3. Verify Twilio billing
4. Collect user feedback

### Short-term (1-7 days)

1. Analyze MSG91 failure root cause
2. Document issues encountered
3. Update migration plan
4. Test fixes in staging
5. Plan re-migration timeline

### Long-term (1-4 weeks)

1. Conduct post-mortem meeting
2. Update rollback procedures
3. Improve monitoring
4. Add automated alerts
5. Plan MSG91 re-migration

## Rollback Communication Template

### Internal Slack/Teams Message

```
🚨 SMS Service Rollback

Status: In Progress / Complete
Provider: MSG91 → Twilio
Reason: [Brief reason]
Impact: [User impact]
ETA: [Completion time]

Action Required:
- Monitor SMS delivery
- Report any issues to #tech-support

Updates: [Link to status page]
```

### User Notification (if needed)

```
Subject: SMS Service Maintenance Complete

Dear Users,

We have completed maintenance on our SMS notification service. 
All SMS notifications are now operational.

If you experience any issues with SMS notifications, please 
contact support at support@yourschool.com

Thank you for your patience.

[Your School Name]
```

## Rollback Metrics to Track

Track these metrics before and after rollback:

1. **SMS Delivery Rate**: Target >95%
2. **Average Delivery Time**: Target <30 seconds
3. **Error Rate**: Target <1%
4. **API Response Time**: Target <2 seconds
5. **Cost per SMS**: Compare with MSG91
6. **User Complaints**: Track support tickets

## Prevention for Future

To avoid needing rollback in future:

1. **Better Testing**: More comprehensive staging tests
2. **Gradual Rollout**: Use percentage-based rollout
3. **Monitoring**: Better real-time monitoring
4. **Alerts**: Automated alerts for high error rates
5. **Fallback**: Automatic fallback on high error rate
6. **Documentation**: Keep this guide updated

## Support Contacts

### Internal

- **DevOps Team**: devops@yourschool.com
- **On-Call Engineer**: [Phone number]
- **Tech Lead**: [Phone number]

### External

- **Twilio Support**: https://support.twilio.com/
- **Twilio Phone**: +1-888-TWILIO-1
- **Twilio Status**: https://status.twilio.com/

## Rollback Log Template

Keep a log of all rollbacks:

```
Date: YYYY-MM-DD HH:MM:SS
Initiated By: [Name]
Reason: [Detailed reason]
Duration: [Time taken]
Impact: [User impact]
Issues Encountered: [Any issues]
Resolution: [How resolved]
Lessons Learned: [Key takeaways]
```

## Conclusion

This rollback procedure ensures you can quickly revert to Twilio if issues arise with MSG91. Always test rollback procedures in staging before production deployment.

For questions or issues, contact your DevOps team or refer to the main migration guide.
