# MSG91 Webhook Setup Guide

This guide explains how to configure and use the MSG91 webhook handler for receiving SMS delivery status updates.

## Overview

The MSG91 webhook handler receives delivery status updates from MSG91 and automatically updates message statuses in the database. This enables real-time tracking of SMS delivery.

## Webhook Endpoint

**URL:** `https://your-domain.com/api/webhooks/msg91`

**Method:** POST

**Content-Type:** application/json

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Required: Authentication token for webhook security
MSG91_WEBHOOK_TOKEN=your-secure-random-token

# Optional: Verification token for GET endpoint
MSG91_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Optional: Comma-separated list of whitelisted IPs
MSG91_WEBHOOK_IPS=1.2.3.4,5.6.7.8
```

### MSG91 Dashboard Configuration

1. Log in to your MSG91 dashboard
2. Navigate to **Settings** → **Webhooks**
3. Add a new webhook with the following details:
   - **URL:** `https://your-domain.com/api/webhooks/msg91?token=your-secure-random-token`
   - **Method:** POST
   - **Events:** Select all delivery status events (SENT, DELIVERED, FAILED, etc.)

## Webhook Payload Format

MSG91 sends webhook notifications with the following JSON structure:

```json
{
  "request_id": "msg-123456",
  "status": "DELIVERED",
  "mobile": "919876543210",
  "description": "Message delivered successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Payload Fields

- **request_id** (required): The message ID returned when the SMS was sent
- **status** (required): Current delivery status (see Status Values below)
- **mobile** (required): Recipient phone number
- **description** (optional): Additional status information
- **timestamp** (optional): ISO 8601 timestamp of the status update

### Status Values

MSG91 sends the following status values:

| MSG91 Status | Mapped Status | Description |
|-------------|---------------|-------------|
| QUEUED | QUEUED | Message queued for sending |
| SENDING | SENT | Message being sent |
| SENT | SENT | Message sent to carrier |
| DELIVERED | DELIVERED | Message delivered to recipient |
| FAILED | FAILED | Message delivery failed |
| REJECTED | FAILED | Message rejected by carrier |
| UNDELIVERED | FAILED | Message not delivered |
| EXPIRED | FAILED | Message expired |
| DELETED | FAILED | Message deleted |

## Security Features

### 1. Authentication Token

The webhook requires a token parameter in the URL for authentication:

```
https://your-domain.com/api/webhooks/msg91?token=your-secure-random-token
```

If the token doesn't match `MSG91_WEBHOOK_TOKEN`, the webhook returns 401 Unauthorized.

### 2. HTTPS Only (Production)

In production, the webhook only accepts HTTPS requests. HTTP requests are rejected.

### 3. IP Whitelisting (Optional)

You can restrict webhook access to specific IP addresses by setting `MSG91_WEBHOOK_IPS`:

```env
MSG91_WEBHOOK_IPS=1.2.3.4,5.6.7.8
```

Requests from non-whitelisted IPs will be rejected with 401 Unauthorized.

## Response Codes

| Status Code | Description |
|------------|-------------|
| 200 | Webhook processed successfully |
| 400 | Invalid payload format or missing required fields |
| 401 | Authentication failed (invalid token or IP) |
| 500 | Internal server error (database update failed) |

## Testing the Webhook

### Using cURL

```bash
curl -X POST https://your-domain.com/api/webhooks/msg91?token=your-token \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-msg-123",
    "status": "DELIVERED",
    "mobile": "919876543210",
    "description": "Test message",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "request_id": "test-msg-123"
}
```

## Verification Endpoint

The webhook also provides a GET endpoint for verification:

**URL:** `https://your-domain.com/api/webhooks/msg91?verify_token=your-verify-token`

**Method:** GET

This endpoint can be used to verify that the webhook is active and properly configured.

## Error Handling

### Message Not Found

If MSG91 sends a webhook for a message that doesn't exist in the database, the webhook:
- Returns 200 OK (to acknowledge receipt)
- Logs a warning message
- Does not update any database records

This prevents MSG91 from retrying webhooks for messages we didn't send.

### Database Errors

If a database error occurs while updating the message status:
- Returns 500 Internal Server Error
- MSG91 will retry the webhook according to their retry policy
- Error is logged for debugging

## Monitoring

### Logs

The webhook logs the following information:

**Successful Processing:**
```
MSG91 webhook received: { request_id, status, mobile, timestamp }
MSG91 webhook processed successfully: { request_id, status }
```

**Errors:**
```
MSG91 webhook authentication failed
MSG91 webhook missing required fields: { payload }
Failed to update message status in database: { error, request_id, status }
MSG91 webhook for unknown message: request_id
```

### Recommended Monitoring

1. **Delivery Rate:** Monitor the percentage of DELIVERED vs FAILED statuses
2. **Error Rate:** Track 500 responses and database errors
3. **Unknown Messages:** Alert on frequent "message not found" warnings
4. **Authentication Failures:** Alert on 401 responses (potential security issue)

## Troubleshooting

### Webhook Not Receiving Updates

1. Verify the webhook URL is correct in MSG91 dashboard
2. Check that the authentication token matches
3. Ensure your server is accessible from MSG91's IPs
4. Check server logs for incoming requests

### Authentication Failures

1. Verify `MSG91_WEBHOOK_TOKEN` is set correctly
2. Check that the token in the URL matches the environment variable
3. If using IP whitelisting, verify MSG91's IPs are whitelisted

### Database Update Failures

1. Check that the message exists in the database
2. Verify database connection is working
3. Check for any database schema issues
4. Review error logs for specific error messages

## Best Practices

1. **Use Strong Tokens:** Generate secure random tokens for authentication
2. **Enable HTTPS:** Always use HTTPS in production
3. **Monitor Logs:** Regularly review webhook logs for issues
4. **Set Up Alerts:** Configure alerts for high error rates
5. **Test Thoroughly:** Test webhook with various status values before going live
6. **Document IPs:** Keep a record of MSG91's webhook IPs for whitelisting

## Related Documentation

- [MSG91 Service Documentation](./MSG91_SERVICE.md)
- [Message Logging Service Documentation](./MESSAGE_LOGGING_SERVICE.md)
- [Communication Service Documentation](./COMMUNICATION_SERVICE.md)

## Support

For issues with:
- **Webhook Configuration:** Check MSG91 dashboard settings
- **Authentication:** Verify environment variables
- **Database Updates:** Check message logging service logs
- **MSG91 API:** Contact MSG91 support

