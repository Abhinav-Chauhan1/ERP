# Twilio to MSG91 Migration Guide

## Overview

This guide provides step-by-step instructions for migrating SMS functionality from Twilio to MSG91 in the School ERP system. MSG91 offers cost-effective SMS services with built-in DLT (Distributed Ledger Technology) compliance for India, making it ideal for Indian schools.

## Why Migrate to MSG91?

1. **Cost-Effective**: MSG91 offers competitive pricing, especially for Indian SMS
2. **DLT Compliance**: Built-in support for Indian telecom regulations
3. **Better Delivery Rates**: Optimized for Indian mobile networks
4. **Local Support**: India-based support team with better timezone coverage
5. **Feature Parity**: All Twilio features are supported in MSG91

## Prerequisites

Before starting the migration:

1. **MSG91 Account**: Sign up at [https://msg91.com/](https://msg91.com/)
2. **DLT Registration**: Complete DLT registration for Indian compliance
3. **Sender ID**: Register your sender ID (e.g., "SCHOOL")
4. **Templates**: Register message templates with DLT template IDs
5. **Backup**: Take a backup of your current environment variables

## Migration Steps

### Step 1: Obtain MSG91 Credentials

1. Log in to your MSG91 dashboard
2. Navigate to **Settings** → **API Keys**
3. Copy your **Auth Key**
4. Navigate to **Sender ID** section
5. Note your approved **Sender ID** (e.g., "SCHOOL")
6. Navigate to **DLT** section
7. Copy your **DLT Template IDs** for each message template

### Step 2: Update Environment Variables

Add the following environment variables to your `.env` file:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_SENDER_ID=SCHOOL
MSG91_ROUTE=transactional
MSG91_COUNTRY=91

# Feature Flag - Set to "true" to enable MSG91
USE_MSG91=false
```

**Important**: Keep `USE_MSG91=false` initially for testing.

### Step 3: Test MSG91 Configuration (Staging)

1. Deploy to staging environment with MSG91 credentials
2. Keep `USE_MSG91=false` (still using Twilio)
3. Verify MSG91 credentials are loaded correctly:

```bash
# Check configuration
curl -X POST https://your-staging-url.com/api/admin/check-sms-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
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

### Step 4: Enable MSG91 in Staging

1. Update environment variable:
   ```bash
   USE_MSG91=true
   ```

2. Restart your application

3. Verify provider switch:
   ```bash
   curl -X POST https://your-staging-url.com/api/admin/check-sms-config \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "configured": true,
       "provider": "MSG91",
       "message": "SMS service is configured and ready to use (Provider: MSG91)"
     }
   }
   ```

### Step 5: Test SMS Sending

Send a test SMS to verify MSG91 integration:

```bash
# Send single SMS
curl -X POST https://your-staging-url.com/api/admin/send-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "message": "Test message from MSG91",
    "dltTemplateId": "your_dlt_template_id"
  }'
```

**Note**: The `dltTemplateId` parameter is required for Indian compliance.

### Step 6: Test Bulk SMS

Test bulk messaging functionality:

```bash
# Send bulk SMS
curl -X POST https://your-staging-url.com/api/admin/send-bulk-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["+919876543210", "+919876543211"],
    "message": "Bulk test message from MSG91",
    "dltTemplateId": "your_dlt_template_id"
  }'
```

### Step 7: Test Delivery Status Tracking

Verify delivery status tracking works:

```bash
# Get delivery status
curl -X GET https://your-staging-url.com/api/admin/sms-status/MESSAGE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 8: Monitor Staging for 24-48 Hours

1. Monitor SMS delivery rates
2. Check for any error logs
3. Verify webhook updates (if configured)
4. Compare costs with Twilio
5. Gather feedback from test users

### Step 9: Production Deployment

Once staging tests are successful:

1. **Backup Production Environment**:
   ```bash
   # Backup current .env file
   cp .env .env.backup.$(date +%Y%m%d)
   ```

2. **Update Production Environment Variables**:
   ```bash
   # Add MSG91 credentials
   MSG91_AUTH_KEY=your_production_msg91_auth_key
   MSG91_SENDER_ID=SCHOOL
   MSG91_ROUTE=transactional
   MSG91_COUNTRY=91
   
   # Enable MSG91
   USE_MSG91=true
   ```

3. **Deploy to Production**:
   ```bash
   # Deploy your application
   npm run build
   # Restart your production server
   ```

4. **Verify Production**:
   - Send test SMS to admin numbers
   - Monitor error logs
   - Check delivery rates

### Step 10: Monitor Production

Monitor the following for the first week:

1. **Delivery Rates**: Compare with Twilio baseline
2. **Error Rates**: Watch for any new errors
3. **Response Times**: Ensure API latency is acceptable
4. **Costs**: Track actual costs vs. projected savings
5. **User Feedback**: Collect feedback from parents/staff

## Environment Variable Reference

### MSG91 Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MSG91_AUTH_KEY` | Yes | - | Your MSG91 authentication key |
| `MSG91_SENDER_ID` | Yes | SCHOOL | Your registered sender ID (6 characters) |
| `MSG91_ROUTE` | No | transactional | Route type: `transactional` or `promotional` |
| `MSG91_COUNTRY` | No | 91 | Default country code (91 for India) |
| `USE_MSG91` | Yes | false | Feature flag to enable MSG91 |

### Twilio Variables (Legacy)

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Yes (if USE_MSG91=false) | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes (if USE_MSG91=false) | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Yes (if USE_MSG91=false) | Twilio phone number |

## DLT Template Management

### What is DLT?

DLT (Distributed Ledger Technology) is a regulatory requirement in India for commercial SMS. All message templates must be registered with your telecom operator.

### Registering Templates

1. Log in to MSG91 dashboard
2. Navigate to **DLT** section
3. Click **Add Template**
4. Enter your message template with variables
5. Submit for approval
6. Once approved, note the **DLT Template ID**

### Template Format

Templates use `{#var#}` for variables:

```
Dear Parent, {#student_name#} was marked {#status#} on {#date#}. Attendance: {#percentage#}%. View details: {#link#}
```

### Using DLT Templates in Code

When sending SMS with MSG91, include the DLT template ID:

```typescript
await sendSMS(
  '+919876543210',
  'Dear Parent, John Doe was marked absent on 2024-01-15. Attendance: 85%. View details: https://...',
  'your_dlt_template_id'
);
```

## Rollback Instructions

If you need to rollback to Twilio:

### Quick Rollback (Production Emergency)

1. **Update Environment Variable**:
   ```bash
   USE_MSG91=false
   ```

2. **Restart Application**:
   ```bash
   # Restart your production server
   pm2 restart all  # or your restart command
   ```

3. **Verify Rollback**:
   ```bash
   curl -X POST https://your-url.com/api/admin/check-sms-config \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

   Should show: `"provider": "Twilio"`

### Complete Rollback

If you need to completely remove MSG91:

1. **Restore Environment Variables**:
   ```bash
   # Restore from backup
   cp .env.backup.YYYYMMDD .env
   ```

2. **Remove MSG91 Variables** (optional):
   ```bash
   # Remove from .env
   # MSG91_AUTH_KEY=...
   # MSG91_SENDER_ID=...
   # MSG91_ROUTE=...
   # MSG91_COUNTRY=...
   # USE_MSG91=...
   ```

3. **Restart Application**

4. **Verify Twilio is Working**

## Troubleshooting

### Issue: "MSG91 service not configured"

**Solution**: Verify environment variables are set correctly:
```bash
echo $MSG91_AUTH_KEY
echo $MSG91_SENDER_ID
echo $USE_MSG91
```

### Issue: "Invalid phone number format"

**Solution**: Ensure phone numbers are in E.164 format:
- Correct: `+919876543210`
- Incorrect: `9876543210`, `+91 98765 43210`

### Issue: "DLT template ID not found"

**Solution**: 
1. Verify template is approved in MSG91 dashboard
2. Check DLT template ID is correct
3. Ensure template content matches registered template

### Issue: "Insufficient balance"

**Solution**:
1. Check MSG91 account balance
2. Add credits to your MSG91 account
3. System will automatically retry once balance is restored

### Issue: SMS not delivered

**Solution**:
1. Check delivery status using message ID
2. Verify phone number is active
3. Check if number is on DND (Do Not Disturb) list
4. Verify sender ID is approved

### Issue: High error rate after migration

**Solution**:
1. Check error logs for specific error codes
2. Verify all DLT templates are approved
3. Ensure phone numbers are properly formatted
4. Contact MSG91 support if issues persist

## Cost Comparison

### Typical Pricing (as of 2024)

| Provider | Transactional SMS (India) | Promotional SMS (India) |
|----------|---------------------------|-------------------------|
| Twilio | ₹0.50 - ₹0.70 per SMS | ₹0.25 - ₹0.35 per SMS |
| MSG91 | ₹0.15 - ₹0.25 per SMS | ₹0.10 - ₹0.15 per SMS |

**Estimated Savings**: 60-70% cost reduction for Indian SMS

### ROI Calculation

For a school sending 10,000 SMS per month:

- **Twilio Cost**: 10,000 × ₹0.60 = ₹6,000/month
- **MSG91 Cost**: 10,000 × ₹0.20 = ₹2,000/month
- **Monthly Savings**: ₹4,000
- **Annual Savings**: ₹48,000

## Feature Comparison

| Feature | Twilio | MSG91 | Notes |
|---------|--------|-------|-------|
| SMS Sending | ✅ | ✅ | Both supported |
| Bulk SMS | ✅ | ✅ | Both supported |
| Delivery Status | ✅ | ✅ | Both supported |
| Webhooks | ✅ | ✅ | Both supported |
| DLT Compliance | ❌ | ✅ | MSG91 built-in |
| Indian Networks | ⚠️ | ✅ | MSG91 optimized |
| International SMS | ✅ | ✅ | Both supported |
| Retry Logic | ✅ | ✅ | Both supported |

## Support

### MSG91 Support

- **Email**: support@msg91.com
- **Phone**: +91-9650-140-140
- **Dashboard**: [https://msg91.com/](https://msg91.com/)
- **Documentation**: [https://docs.msg91.com/](https://docs.msg91.com/)

### Internal Support

For issues with the migration:
1. Check error logs in your application
2. Review this migration guide
3. Contact your development team
4. Refer to the main WhatsApp Notification System documentation

## Best Practices

1. **Always Test in Staging First**: Never enable MSG91 directly in production
2. **Monitor Closely**: Watch delivery rates and error logs for the first week
3. **Keep Twilio Credentials**: Don't remove Twilio credentials immediately (for rollback)
4. **Update Templates**: Ensure all message templates have DLT IDs
5. **Document Changes**: Keep a log of when you switched providers
6. **Train Staff**: Inform admin staff about the new provider
7. **Budget Planning**: Update budget projections with new costs

## Checklist

Use this checklist to track your migration progress:

- [ ] MSG91 account created
- [ ] DLT registration completed
- [ ] Sender ID approved
- [ ] Message templates registered with DLT
- [ ] MSG91 credentials obtained
- [ ] Environment variables updated in staging
- [ ] Staging tests completed successfully
- [ ] 24-48 hour monitoring period completed
- [ ] Production environment variables updated
- [ ] Production deployment completed
- [ ] Production verification completed
- [ ] First week monitoring completed
- [ ] Cost comparison analysis completed
- [ ] Documentation updated
- [ ] Staff training completed
- [ ] Twilio account deactivated (optional, after 30 days)

## Timeline

Recommended migration timeline:

| Phase | Duration | Activities |
|-------|----------|------------|
| Planning | 1-2 days | Account setup, DLT registration |
| Staging Setup | 1 day | Configure staging environment |
| Staging Testing | 2-3 days | Comprehensive testing |
| Monitoring | 2-3 days | Monitor staging performance |
| Production Deploy | 1 day | Deploy to production |
| Production Monitor | 7 days | Close monitoring |
| Optimization | Ongoing | Fine-tune based on metrics |

**Total Estimated Time**: 2-3 weeks

## Conclusion

The migration from Twilio to MSG91 provides significant cost savings and better compliance for Indian schools. By following this guide carefully and testing thoroughly, you can ensure a smooth transition with minimal disruption to your SMS services.

For questions or issues, refer to the troubleshooting section or contact your development team.
