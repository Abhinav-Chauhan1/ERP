# Troubleshooting Guide - SikshaMitra ERP

## Overview

This guide helps super administrators diagnose and resolve common issues in the SikshaMitra ERP system.

## Quick Diagnostic Checklist

When encountering issues, start with these basic checks:

- [ ] System health status (Dashboard → Health)
- [ ] Recent error logs (Monitoring → Logs)
- [ ] Database connectivity
- [ ] Cache service status
- [ ] External service availability

## Common Issues & Solutions

### 1. Login & Authentication Issues

#### Problem: Users cannot log in
**Symptoms:**
- "Invalid credentials" error
- Login page redirects in loop
- Session expires immediately

**Diagnosis:**
1. Check user account status
2. Verify school status (active/suspended)
3. Review authentication logs
4. Check session configuration

**Solutions:**
```bash
# Check user status
GET /api/super-admin/users/{userId}

# Reset user password
POST /api/super-admin/users/{userId}/reset-password

# Check school status
GET /api/super-admin/schools/{schoolId}
```

#### Problem: Two-factor authentication not working
**Symptoms:**
- OTP not received
- Invalid OTP error
- 2FA setup fails

**Solutions:**
1. Verify SMS/email service configuration
2. Check user's contact information
3. Regenerate 2FA secret
4. Temporarily disable 2FA for troubleshooting

### 2. Performance Issues

#### Problem: Slow API responses
**Symptoms:**
- Page load times > 5 seconds
- Timeout errors
- High server response times

**Diagnosis:**
1. Check system health dashboard
2. Review database query performance
3. Monitor cache hit rates
4. Check server resource usage

**Solutions:**
```bash
# Clear cache
POST /api/super-admin/system/cache/clear

# Check database performance
GET /api/super-admin/monitoring/performance

# Restart services (if needed)
POST /api/super-admin/system/restart
```

#### Problem: High memory usage
**Symptoms:**
- Out of memory errors
- System slowdown
- Service crashes

**Solutions:**
1. Restart application services
2. Clear cache and temporary files
3. Review memory-intensive operations
4. Scale server resources if needed

### 3. Database Issues

#### Problem: Database connection errors
**Symptoms:**
- "Database connection failed"
- Query timeout errors
- Data not saving

**Diagnosis:**
```bash
# Check database health
GET /api/super-admin/system/health

# Test database connection
POST /api/super-admin/system/database/test
```

**Solutions:**
1. Restart database service
2. Check connection pool settings
3. Verify database credentials
4. Review database logs

#### Problem: Data inconsistency
**Symptoms:**
- Missing records
- Duplicate entries
- Incorrect relationships

**Solutions:**
1. Run data integrity checks
2. Review recent migrations
3. Check audit logs for changes
4. Restore from backup if necessary

### 4. Backup & Restore Issues

#### Problem: Backup creation fails
**Symptoms:**
- Backup status shows "FAILED"
- Error messages in backup logs
- Incomplete backup files

**Diagnosis:**
```bash
# Check backup status
GET /api/super-admin/schools/{schoolId}/backups

# View backup logs
GET /api/super-admin/schools/{schoolId}/backups/{backupId}/logs
```

**Solutions:**
1. Check available disk space
2. Verify backup directory permissions
3. Review backup configuration
4. Retry backup with different settings

#### Problem: Restore operation fails
**Symptoms:**
- Restore process stops
- Data not restored correctly
- System becomes unstable

**Solutions:**
1. Verify backup file integrity
2. Check system resources
3. Restore to staging environment first
4. Contact support for complex restores

### 5. Billing & Payment Issues

#### Problem: Payment processing fails
**Symptoms:**
- Payment declined
- Subscription not updated
- Billing errors

**Diagnosis:**
1. Check payment gateway status
2. Verify payment method details
3. Review transaction logs
4. Check subscription limits

**Solutions:**
```bash
# Retry payment
POST /api/super-admin/billing/payments/{paymentId}/retry

# Update payment method
PUT /api/super-admin/schools/{schoolId}/billing/payment-method

# Check subscription status
GET /api/super-admin/schools/{schoolId}/billing/subscription
```

### 6. Notification Issues

#### Problem: Notifications not sent
**Symptoms:**
- Users not receiving emails/SMS
- Notification queue backing up
- Service errors

**Diagnosis:**
1. Check notification service status
2. Verify service credentials
3. Review notification logs
4. Test notification delivery

**Solutions:**
```bash
# Test notification service
POST /api/super-admin/notifications/test

# Clear notification queue
POST /api/super-admin/notifications/queue/clear

# Resend failed notifications
POST /api/super-admin/notifications/retry
```

### 7. File Upload & Storage Issues

#### Problem: File uploads fail
**Symptoms:**
- Upload timeout errors
- Files not appearing
- Storage quota exceeded

**Solutions:**
1. Check storage quota and usage
2. Verify file size limits
3. Test storage service connectivity
4. Clear temporary files

### 8. Integration Issues

#### Problem: External service integration fails
**Symptoms:**
- API calls to external services fail
- Webhook delivery issues
- Service authentication errors

**Diagnosis:**
```bash
# Test external service
GET /api/super-admin/integrations/external/{serviceId}/test

# Check webhook status
GET /api/super-admin/webhooks/status
```

**Solutions:**
1. Verify API credentials
2. Check service endpoints
3. Review rate limiting
4. Update integration settings

## System Monitoring

### Health Check Endpoints

```bash
# Overall system health
GET /api/super-admin/system/health

# Database health
GET /api/super-admin/system/health/database

# Cache health
GET /api/super-admin/system/health/cache

# External services health
GET /api/super-admin/system/health/external
```

### Log Analysis

#### Error Log Locations
- Application logs: `/var/log/sikshamitra/app.log`
- Database logs: `/var/log/postgresql/`
- Web server logs: `/var/log/nginx/`

#### Common Error Patterns
```bash
# Database connection errors
grep "database connection" /var/log/sikshamitra/app.log

# Authentication failures
grep "authentication failed" /var/log/sikshamitra/app.log

# API rate limiting
grep "rate limit exceeded" /var/log/sikshamitra/app.log
```

## Emergency Procedures

### System Outage Response

1. **Immediate Actions**
   - Check system health dashboard
   - Identify affected services
   - Notify stakeholders

2. **Diagnosis**
   - Review error logs
   - Check resource usage
   - Test service connectivity

3. **Resolution**
   - Restart affected services
   - Scale resources if needed
   - Apply emergency fixes

4. **Recovery**
   - Verify system functionality
   - Monitor for stability
   - Document incident

### Data Recovery

1. **Assess Data Loss**
   - Identify affected data
   - Determine recovery point
   - Check backup availability

2. **Recovery Process**
   - Stop affected services
   - Restore from backup
   - Verify data integrity
   - Restart services

3. **Validation**
   - Test system functionality
   - Verify user access
   - Check data consistency

## Performance Optimization

### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze table statistics
ANALYZE;

-- Reindex if needed
REINDEX DATABASE sikshamitra;
```

### Cache Optimization
```bash
# Check cache statistics
GET /api/super-admin/system/cache/stats

# Clear specific cache keys
DELETE /api/super-admin/system/cache/keys/{pattern}

# Warm up cache
POST /api/super-admin/system/cache/warmup
```

## Preventive Measures

### Daily Monitoring
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Verify backup completion

### Weekly Maintenance
- [ ] Update system statistics
- [ ] Clean up temporary files
- [ ] Review performance metrics
- [ ] Test disaster recovery procedures

### Monthly Reviews
- [ ] Analyze performance trends
- [ ] Review security logs
- [ ] Update documentation
- [ ] Plan capacity upgrades

## Getting Help

### Internal Escalation
1. Check this troubleshooting guide
2. Review system documentation
3. Consult with team members
4. Contact technical lead

### External Support
- **Email**: support@sikshamitra.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Documentation**: docs.sikshamitra.com
- **Status Page**: status.sikshamitra.com

### Information to Provide
When contacting support, include:
- Error messages and screenshots
- Steps to reproduce the issue
- System health status
- Recent changes or deployments
- Affected users/schools

## Tools & Commands

### Useful API Endpoints
```bash
# System status
curl -H "Authorization: Bearer $TOKEN" \
     https://api.sikshamitra.com/api/super-admin/system/health

# Clear cache
curl -X POST -H "Authorization: Bearer $TOKEN" \
     https://api.sikshamitra.com/api/super-admin/system/cache/clear

# Test database
curl -X POST -H "Authorization: Bearer $TOKEN" \
     https://api.sikshamitra.com/api/super-admin/system/database/test
```

### Database Queries
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(size) as size
FROM (
  SELECT schemaname,tablename,pg_total_relation_size(schemaname||'.'||tablename) as size
  FROM pg_tables WHERE schemaname = 'public'
) s
ORDER BY size DESC;

-- Check recent errors
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0  
**For Support**: support@sikshamitra.com