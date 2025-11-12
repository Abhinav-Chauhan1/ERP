# Payment Gateway Integration Guide

## Overview

This document describes the Razorpay payment gateway integration for the School ERP system. The integration enables parents to pay school fees online securely.

## Architecture

### Components

1. **Payment Gateway Utility** (`payment-gateway.ts`)
   - Core functions for Razorpay integration
   - Order creation
   - Signature verification
   - Webhook validation

2. **API Routes**
   - `/api/payments/create` - Creates payment orders
   - `/api/payments/verify` - Verifies payment signatures
   - `/api/payments/webhook` - Handles Razorpay webhooks

3. **Server Actions** (`parent-fee-actions.ts`)
   - High-level payment operations
   - Database integration
   - Parent authorization

## Setup Instructions

### 1. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate API keys (Test mode for development)
4. Copy Key ID and Key Secret

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Important:**
- Use test keys (`rzp_test_`) for development
- Use live keys (`rzp_live_`) for production
- Never commit real keys to version control
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safe to expose to client

### 3. Configure Webhooks

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events to listen:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.created`
   - `refund.processed`
4. Copy the webhook secret and add to `.env`

## Payment Flow

### 1. Create Payment Order

```typescript
// Client-side or Server Action
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    childId: 'student_id',
    feeStructureId: 'fee_structure_id',
    amount: 5000, // Amount in INR
    currency: 'INR',
    feeTypeIds: ['fee_type_1', 'fee_type_2']
  })
});

const { data } = await response.json();
// data.orderId - Use this for Razorpay checkout
```

### 2. Initialize Razorpay Checkout

```typescript
// Client-side
const options = {
  key: data.keyId,
  amount: data.amount,
  currency: data.currency,
  order_id: data.orderId,
  name: 'School Name',
  description: 'Fee Payment',
  handler: async function (response) {
    // Payment successful
    await verifyPayment(response);
  },
  prefill: {
    name: 'Parent Name',
    email: 'parent@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#3399cc'
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### 3. Verify Payment

```typescript
// After successful payment
const verifyResponse = await fetch('/api/payments/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: response.razorpay_order_id,
    paymentId: response.razorpay_payment_id,
    signature: response.razorpay_signature,
    childId: 'student_id',
    feeStructureId: 'fee_structure_id',
    amount: 5000,
    feeTypeIds: ['fee_type_1', 'fee_type_2']
  })
});

const result = await verifyResponse.json();
// result.data.receiptNumber - Receipt for download
```

## Security Features

### 1. Rate Limiting

Both create and verify endpoints implement rate limiting:
- Create: 5 requests per 10 seconds per user
- Verify: 10 requests per 10 seconds per user

### 2. Signature Verification

All payments are verified using HMAC SHA256:
```
signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
```

### 3. Webhook Validation

Webhooks are validated using Razorpay signature:
```
signature = HMAC_SHA256(webhook_body, webhook_secret)
```

### 4. Authorization Checks

- User authentication via Clerk
- Parent role verification
- Parent-child relationship validation
- Fee structure validation

## Error Handling

### Common Errors

1. **Invalid Signature** (400)
   - Payment signature doesn't match
   - Possible tampering attempt
   - Action: Reject payment

2. **Rate Limit Exceeded** (429)
   - Too many requests
   - Action: Wait and retry

3. **Unauthorized** (401)
   - User not authenticated
   - Action: Redirect to login

4. **Access Denied** (403)
   - Parent-child relationship invalid
   - Action: Show error message

5. **Payment Failed** (500)
   - Gateway error
   - Action: Show error, allow retry

## Testing

### Test Cards

Razorpay provides test cards for development:

**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Test Webhooks

Use Razorpay Dashboard to send test webhooks:
1. Go to Webhooks section
2. Click "Send Test Webhook"
3. Select event type
4. Verify webhook processing

## Monitoring

### Logs

All payment operations are logged:
- Order creation
- Payment verification
- Webhook processing
- Errors and failures

### Database Records

Payment records are stored in `FeePayment` table:
- Transaction ID (Razorpay payment ID)
- Order ID (in remarks)
- Status (PENDING, COMPLETED, FAILED, REFUNDED)
- Amount and payment method
- Receipt number

## Production Checklist

- [ ] Replace test keys with live keys
- [ ] Configure production webhook URL
- [ ] Enable HTTPS
- [ ] Set up error monitoring (Sentry)
- [ ] Configure email notifications
- [ ] Test payment flow end-to-end
- [ ] Verify webhook handling
- [ ] Set up payment reconciliation
- [ ] Configure refund process
- [ ] Document support procedures

## API Reference

### POST /api/payments/create

Creates a Razorpay order for payment.

**Request:**
```json
{
  "childId": "string",
  "feeStructureId": "string",
  "amount": number,
  "currency": "INR",
  "feeTypeIds": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "amount": 500000,
    "currency": "INR",
    "receipt": "RCP-xxx",
    "keyId": "rzp_test_xxx"
  }
}
```

### POST /api/payments/verify

Verifies payment signature and updates status.

**Request:**
```json
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx",
  "childId": "string",
  "feeStructureId": "string",
  "amount": number,
  "feeTypeIds": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_db_id",
    "receiptNumber": "RCP-xxx",
    "status": "COMPLETED",
    "amount": 5000,
    "paidAmount": 5000,
    "paymentDate": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/payments/webhook

Handles Razorpay webhook callbacks.

**Headers:**
```
x-razorpay-signature: signature_xxx
```

**Request:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": { ... }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Support

For issues or questions:
1. Check Razorpay documentation: https://razorpay.com/docs/
2. Review error logs
3. Contact Razorpay support
4. Refer to this documentation

## References

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Payment Gateway Security](https://razorpay.com/docs/payments/security/)
