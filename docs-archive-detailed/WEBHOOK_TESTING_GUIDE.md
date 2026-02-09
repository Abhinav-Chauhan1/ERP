# Webhook Testing Guide

## Quick Start

This guide provides instructions for testing MSG91 and WhatsApp webhooks locally and in production.

---

## Prerequisites

1. Development server running: `npm run dev`
2. Database migrations applied: `npx prisma migrate dev`
3. Environment variables configured (see below)

---

## Environment Configuration

### MSG91 Webhook

```env
# Required
MSG91_WEBHOOK_TOKEN=your-secret-token-here

# Optional
MSG91_WEBHOOK_VERIFY_TOKEN=your-verify-token
MSG91_WEBHOOK_IPS=1.2.3.4,5.6.7.8
```

### WhatsApp Webhook

```env
# Required
WHATSAPP_APP_SECRET=your-app-secret-from-meta
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
```

---

## Running Unit Tests

### Test MSG91 Webhook

```bash
npm test -- src/app/api/webhooks/msg91/__tests__/route.test.ts --run
```

**Expected Output:**
```
✓ MSG91 Webhook Handler (14 tests)
  ✓ POST /api/webhooks/msg91 (12 tests)
  ✓ GET /api/webhooks/msg91 (2 tests)

Test Files  1 passed (1)
Tests       14 passed (14)
```

### Test WhatsApp Webhook

```bash
npm test -- src/app/api/webhooks/whatsapp/__tests__/route.test.ts --run
```

**Expected Output:**
```
✓ WhatsApp Webhook Handler (18 tests)
  ✓ GET /api/webhooks/whatsapp - Webhook Verification (5 tests)
  ✓ POST /api/webhooks/whatsapp - Status Updates (10 tests)
  ✓ POST /api/webhooks/whatsapp - Incoming Messages (3 tests)

Test Files  1 passed (1)
Tests       18 passed (18)
```

### Run All Webhook Tests

```bash
npm test -- src/app/api/webhooks --run
```

---

## Running Integration Tests

The integration test script tests webhooks against a running development server.

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Run Integration Tests

In a separate terminal:

```bash
npx tsx scripts/test-webhook-integration.ts
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║         Webhook Integration Test Suite                    ║
╚════════════════════════════════════════════════════════════╝

=== Testing MSG91 Webhooks ===

Testing: DELIVERED status
  ✅ Passed: Status updated to DELIVERED

Testing: FAILED status
  ✅ Passed: Status updated to FAILED

Testing: REJECTED status (mapped to FAILED)
  ✅ Passed: Status updated to FAILED

✓ MSG91 webhook tests completed

=== Testing WhatsApp Webhook Verification ===

Testing: Webhook verification challenge
  ✅ Passed: Webhook verification successful

✓ WhatsApp webhook verification test completed

=== Testing WhatsApp Webhooks ===

Testing: DELIVERED status
  ✅ Passed: Status updated to DELIVERED

Testing: READ status
  ✅ Passed: Status updated to READ

Testing: FAILED status with error
  ✅ Passed: Status updated to FAILED

✓ WhatsApp webhook tests completed

=== Testing WhatsApp Incoming Messages ===

Testing: Text message
  ✅ Passed: Incoming message logged

Testing: Button response
  ✅ Passed: Incoming message logged

✓ WhatsApp incoming message tests completed

╔════════════════════════════════════════════════════════════╗
║                  All Tests Completed                       ║
╚════════════════════════════════════════════════════════════╝
```

---

## Manual Testing with cURL

### MSG91 Webhook

#### Test DELIVERED Status

```bash
curl -X POST "http://localhost:3000/api/webhooks/msg91?token=test-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-msg-123",
    "status": "DELIVERED",
    "mobile": "919876543210",
    "description": "Message delivered successfully",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

#### Test FAILED Status

```bash
curl -X POST "http://localhost:3000/api/webhooks/msg91?token=test-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-msg-456",
    "status": "FAILED",
    "mobile": "919876543210",
    "description": "Invalid number",
    "timestamp": "2024-01-15T10:35:00Z"
  }'
```

#### Test Webhook Verification

```bash
curl "http://localhost:3000/api/webhooks/msg91?verify_token=verify-123"
```

---

### WhatsApp Webhook

#### Test Webhook Verification

```bash
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=test-challenge-123"
```

**Expected Response:** `test-challenge-123`

#### Test DELIVERED Status (with signature)

First, create a signature using Node.js:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'entry-123',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '15551234567',
          phone_number_id: 'phone-123'
        },
        statuses: [{
          id: 'wamid.test123',
          status: 'delivered',
          timestamp: '1705315800',
          recipient_id: '919876543210'
        }]
      },
      field: 'messages'
    }]
  }]
});

const signature = crypto
  .createHmac('sha256', 'test-app-secret')
  .update(payload)
  .digest('hex');

console.log('Signature:', `sha256=${signature}`);
console.log('Payload:', payload);
```

Then use the signature in cURL:

```bash
curl -X POST "http://localhost:3000/api/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=YOUR_SIGNATURE_HERE" \
  -d 'YOUR_PAYLOAD_HERE'
```

---

## Testing with Postman

### MSG91 Webhook Collection

1. **Create Collection:** "MSG91 Webhooks"

2. **Add Request:** "Test DELIVERED Status"
   - Method: POST
   - URL: `http://localhost:3000/api/webhooks/msg91?token=test-token-123`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "request_id": "msg-{{$timestamp}}",
       "status": "DELIVERED",
       "mobile": "919876543210",
       "description": "Message delivered successfully",
       "timestamp": "{{$isoTimestamp}}"
     }
     ```

3. **Add Request:** "Test FAILED Status"
   - Same as above, change status to "FAILED"

### WhatsApp Webhook Collection

1. **Create Collection:** "WhatsApp Webhooks"

2. **Add Request:** "Test Webhook Verification"
   - Method: GET
   - URL: `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=test-challenge`

3. **Add Request:** "Test DELIVERED Status"
   - Method: POST
   - URL: `http://localhost:3000/api/webhooks/whatsapp`
   - Headers:
     - `Content-Type: application/json`
     - `x-hub-signature-256: sha256=SIGNATURE` (use Pre-request Script to generate)
   - Pre-request Script:
     ```javascript
     const crypto = require('crypto-js');
     const payload = pm.request.body.raw;
     const secret = 'test-app-secret';
     const signature = crypto.HmacSHA256(payload, secret).toString();
     pm.request.headers.add({
       key: 'x-hub-signature-256',
       value: `sha256=${signature}`
     });
     ```
   - Body (raw JSON):
     ```json
     {
       "object": "whatsapp_business_account",
       "entry": [{
         "id": "entry-123",
         "changes": [{
           "value": {
             "messaging_product": "whatsapp",
             "metadata": {
               "display_phone_number": "15551234567",
               "phone_number_id": "phone-123"
             },
             "statuses": [{
               "id": "wamid.{{$timestamp}}",
               "status": "delivered",
               "timestamp": "{{$timestamp}}",
               "recipient_id": "919876543210"
             }]
           },
           "field": "messages"
         }]
       }]
     }
     ```

---

## Verifying Database Updates

After sending webhook requests, verify database updates:

```bash
npx prisma studio
```

Navigate to `MessageLog` table and check:
- Status field is updated correctly
- Timestamps are set (deliveredAt, failedAt, readAt)
- Error information is stored (for failed messages)

Or use SQL:

```sql
-- Check recent message logs
SELECT 
  messageId,
  channel,
  status,
  sentAt,
  deliveredAt,
  readAt,
  failedAt,
  errorCode,
  errorMessage
FROM MessageLog
ORDER BY createdAt DESC
LIMIT 10;
```

---

## Troubleshooting

### MSG91 Webhook Returns 401

**Problem:** Webhook authentication failed

**Solutions:**
1. Check `MSG91_WEBHOOK_TOKEN` environment variable is set
2. Verify token in URL matches environment variable
3. Check for HTTPS in production (set `NODE_ENV=production`)

### WhatsApp Webhook Returns 401

**Problem:** Signature verification failed

**Solutions:**
1. Check `WHATSAPP_APP_SECRET` environment variable is set
2. Verify signature is calculated correctly using HMAC-SHA256
3. Ensure signature header is `x-hub-signature-256` with `sha256=` prefix
4. Verify payload string matches exactly (no extra whitespace)

### Webhook Returns 400

**Problem:** Invalid payload

**Solutions:**
1. Check JSON is valid
2. Verify all required fields are present
3. Check field names match expected format

### Database Not Updated

**Problem:** Webhook succeeds but database not updated

**Solutions:**
1. Check message log exists with matching messageId
2. Verify database connection is working
3. Check Prisma schema is up to date: `npx prisma generate`
4. Check for errors in server logs

### WhatsApp Verification Fails

**Problem:** Cannot verify webhook in Meta dashboard

**Solutions:**
1. Check `WHATSAPP_VERIFY_TOKEN` matches token in Meta dashboard
2. Verify webhook URL is accessible from internet (use ngrok for local testing)
3. Check GET endpoint returns challenge string
4. Ensure no authentication middleware blocks GET requests

---

## Production Setup

### MSG91 Webhook

1. Set production environment variables:
   ```env
   MSG91_WEBHOOK_TOKEN=your-production-token
   MSG91_WEBHOOK_IPS=msg91-ip-1,msg91-ip-2
   NODE_ENV=production
   ```

2. Configure webhook in MSG91 dashboard:
   - URL: `https://your-domain.com/api/webhooks/msg91?token=YOUR_TOKEN`
   - Enable delivery reports

3. Test with sample message

### WhatsApp Webhook

1. Set production environment variables:
   ```env
   WHATSAPP_APP_SECRET=your-production-app-secret
   WHATSAPP_VERIFY_TOKEN=your-production-verify-token
   NODE_ENV=production
   ```

2. Configure webhook in Meta App Dashboard:
   - URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Verify token: (must match WHATSAPP_VERIFY_TOKEN)
   - Subscribe to: `messages`, `message_status`

3. Complete verification challenge

4. Test with sample message

---

## Monitoring

### Check Webhook Logs

```bash
# View recent webhook activity
tail -f logs/webhook.log

# Search for specific message ID
grep "wamid.123" logs/webhook.log

# Count webhook calls by status
grep "webhook processed" logs/webhook.log | wc -l
```

### Database Queries

```sql
-- Webhook activity in last hour
SELECT 
  channel,
  status,
  COUNT(*) as count
FROM MessageLog
WHERE updatedAt > NOW() - INTERVAL 1 HOUR
GROUP BY channel, status;

-- Failed messages
SELECT 
  messageId,
  channel,
  recipient,
  errorCode,
  errorMessage,
  failedAt
FROM MessageLog
WHERE status = 'FAILED'
ORDER BY failedAt DESC
LIMIT 20;

-- Delivery rate by channel
SELECT 
  channel,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  ROUND(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as delivery_rate
FROM MessageLog
WHERE sentAt > NOW() - INTERVAL 24 HOUR
GROUP BY channel;
```

---

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test with unit tests first
4. Use integration tests to verify end-to-end flow
5. Check webhook payload format matches documentation

---

## References

- [MSG91 Webhook Documentation](https://docs.msg91.com/p/tf9GTextN/e/Hd-qPPzLn/MSG91-Webhooks)
- [WhatsApp Business API Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [HMAC Signature Verification](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests)
