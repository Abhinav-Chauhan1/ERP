# Cashfree Payment Integration Setup

SikshaMitra uses Cashfree for two payment flows:

1. **School fee payments** — parents paying student fees via Cashfree checkout
2. **SaaS subscription billing** — schools paying for the SikshaMitra platform

---

## Environment Variables

```env
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_CASHFREE_ENV=sandbox       # change to "production" for live
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Get credentials from: https://merchant.cashfree.com/merchants/developer/api-keys

---

## Webhook URLs to Register in Cashfree Dashboard

Register both URLs under **Developers → Webhooks**:

| Flow | URL |
|---|---|
| School fee payments | `https://<domain>/api/payments/webhook` |
| SaaS subscription billing | `https://<domain>/api/subscription/webhook` |

**Events to enable for both:**
- `PAYMENT_SUCCESS_WEBHOOK`
- `PAYMENT_FAILED_WEBHOOK`
- `PAYMENT_USER_DROPPED_WEBHOOK`
- `REFUND_SUCCESS_WEBHOOK` (fee payments webhook only)

---

## Sandbox Testing

### Test card (Cashfree sandbox)
| Field | Value |
|---|---|
| Card number | 4111 1111 1111 1111 |
| Expiry | Any future date (e.g. 12/26) |
| CVV | Any 3 digits |
| Name | Any name |

### UPI (sandbox)
Use UPI ID: `success@upi` to simulate a successful payment.

---

## Payment Flows

### Flow 1: Parent pays school fees
1. Parent visits `/parent/fees/payment`
2. Selects fee items and clicks "Pay Online"
3. Frontend calls `POST /api/payments/create` → gets `paymentSessionId`
4. Cashfree JS SDK redirects to checkout
5. On success, Cashfree redirects to `/parent/fees/payment/success?cfOrderId=...`
6. Success page calls `verifyPayment()` server action → verifies with Cashfree API
7. `FeePayment` record created with status `COMPLETED`
8. Cashfree also sends webhook to `/api/payments/webhook` (idempotent fallback)

### Flow 2: School subscribes to SikshaMitra
1. School admin calls `POST /api/subscription/checkout` with `{ planId, studentCount }`
2. Amount calculated as `max(studentCount × planRate, minimumMonthly)`
3. Returns `{ paymentSessionId, cfOrderId }` for frontend checkout
4. On success, Cashfree sends `PAYMENT_SUCCESS_WEBHOOK` to `/api/subscription/webhook`
5. `EnhancedSubscription` activated, `school.plan` updated

---

## Super Admin: Manual Subscription Activation

To activate a school subscription without payment (offline payment or demo):

```
PUT /api/super-admin/billing/subscriptions/{id}
{
  "action": "activate",
  "endDate": "2026-07-01T00:00:00.000Z"  // optional, defaults to +1 month
}
```

This sets `EnhancedSubscription.status = ACTIVE` and syncs `school.plan` to the plan's tier.

---

## Subscription Expiry Behaviour

- When a subscription expires or is cancelled, `school.plan` is automatically reset to `STARTER`
- `requirePlanFeature()` checks both `school.plan` AND active subscription status
- STARTER tier features are always accessible regardless of subscription state

---

## Switching to Production

1. Create a production app in the Cashfree merchant dashboard
2. Update `.env`:
   ```
   CASHFREE_APP_ID=<prod_app_id>
   CASHFREE_SECRET_KEY=<prod_secret_key>
   CASHFREE_WEBHOOK_SECRET=<prod_webhook_secret>
   NEXT_PUBLIC_CASHFREE_ENV=production
   ```
3. Register production webhook URLs in the Cashfree dashboard
4. Test with a real UPI or card payment before going live
