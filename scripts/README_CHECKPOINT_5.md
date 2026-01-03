# Checkpoint 5: Core Services Test Suite

## Quick Start

Run the checkpoint test suite:

```bash
npx tsx scripts/test-checkpoint-5-core-services.ts
```

## What This Tests

This checkpoint verifies that the core MSG91 and WhatsApp services are working correctly:

### ✅ Configuration Management
- MSG91 configuration validation
- WhatsApp configuration validation
- Environment variable checks
- Graceful handling of missing configuration

### ✅ Phone Number Validation
- E.164 format validation
- Country code handling
- Phone number formatting
- Edge case handling (empty, invalid, too short, too long)

### ✅ Retry Logic
- Exponential backoff algorithm
- Configurable retry parameters
- Non-retryable error detection
- SMS-specific retry configuration
- WhatsApp-specific retry configuration
- Jitter support

### ✅ Service Integration
- MSG91 SMS service initialization
- WhatsApp service initialization
- Retry logic integration
- Error handling

## Test Modes

### Offline Mode (Default)

When API credentials are not configured, tests run in offline mode:
- Configuration checks verify the service correctly reports "not configured"
- Phone number validation tests run
- Retry logic tests run with mock operations
- Message sending tests are skipped

### Online Mode (With Credentials)

When API credentials are configured, tests run in online mode:
- All offline tests run
- Plus: Real SMS sending via MSG91
- Plus: Real WhatsApp message sending
- Plus: Delivery status checks

## Environment Variables

### MSG91 Configuration

```env
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=SCHOOL
MSG91_ROUTE=transactional
MSG91_COUNTRY=91
```

### WhatsApp Configuration

```env
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_API_VERSION=v18.0
```

### Test Phone Numbers (Optional)

```env
TEST_PHONE_NUMBER=+919876543210
TEST_PHONE_NUMBER_1=+919876543210
TEST_PHONE_NUMBER_2=+919876543211
```

## Test Output

### Success Output

```
████████████████████████████████████████████████████████████████████████████████
  CHECKPOINT 5: CORE SERVICES TEST SUITE
████████████████████████████████████████████████████████████████████████████████

================================================================================
TEST SUMMARY
================================================================================

⚠ MSG91 Configuration: NOT CONFIGURED (skipped)
⚠ WhatsApp Configuration: NOT CONFIGURED (skipped)
✓ Phone Number Validation: PASSED
✓ MSG91 SMS Sending: PASSED
✓ MSG91 Bulk SMS: PASSED
✓ WhatsApp Text Message: PASSED
✓ Retry Logic: PASSED
✓ SMS with Retry: PASSED
✓ WhatsApp with Retry: PASSED

✓ ALL CORE TESTS PASSED (7/7)

Checkpoint 5 completed successfully! Core services are working correctly.
```

### Color Coding

- 🟢 **Green (✓):** Test passed
- 🔴 **Red (✗):** Test failed
- 🟡 **Yellow (⚠):** Warning or skipped
- 🔵 **Cyan (ℹ):** Information

## Test Details

### Test 1: MSG91 Configuration
Verifies that MSG91 service can check its configuration status and report missing environment variables.

### Test 2: WhatsApp Configuration
Verifies that WhatsApp service can check its configuration status and report missing environment variables.

### Test 3: Phone Number Validation
Tests E.164 format validation with various valid and invalid phone numbers:
- Valid Indian numbers (10 digits)
- Valid US numbers (10 digits)
- Valid numbers with varying digit counts
- Invalid formats (missing country code, too short, too long, empty, malformed)

### Test 4: MSG91 SMS Sending
Sends a test SMS via MSG91 and verifies:
- Message is sent successfully
- Message ID is returned
- Delivery status can be queried

### Test 5: MSG91 Bulk SMS
Sends bulk SMS to multiple recipients and verifies:
- All messages are processed
- Individual results are tracked
- Success/failure counts are accurate

### Test 6: WhatsApp Text Message
Sends a test WhatsApp message and verifies:
- Message is sent successfully
- Message ID is returned
- Delivery status can be queried

### Test 7: Retry Logic
Comprehensive retry logic tests:
- **7.1:** Successful operations (no retries needed)
- **7.2:** Retryable errors (retries up to max)
- **7.3:** Non-retryable errors (stops immediately)
- **7.4:** Max retries exhausted
- **7.5:** Exponential backoff timing
- **7.6:** SMS-specific retry configuration
- **7.7:** WhatsApp-specific retry configuration
- **7.8:** Error retryability detection

### Test 8: SMS with Retry
Tests SMS sending with integrated retry logic.

### Test 9: WhatsApp with Retry
Tests WhatsApp sending with integrated retry logic.

## Troubleshooting

### All Tests Pass But Services Not Configured

This is expected! The test suite runs in offline mode when credentials are not configured. This allows testing the core logic without requiring API access.

### Configuration Tests Fail

If configuration tests fail (not just report "not configured"), check:
1. Environment variables are properly set
2. No typos in variable names
3. Values are not empty strings

### Phone Number Validation Fails

If phone number validation tests fail:
1. Check that the E.164 regex is correct
2. Verify test cases match E.164 specification
3. Ensure both MSG91 and WhatsApp use the same validation

### Retry Logic Fails

If retry logic tests fail:
1. Check exponential backoff calculation
2. Verify jitter is working correctly
3. Ensure non-retryable errors are properly classified
4. Check that max retries are respected

### Message Sending Fails (Online Mode)

If message sending fails when credentials are configured:
1. Verify API credentials are correct
2. Check account balance (MSG91)
3. Verify phone number is in correct format
4. Check API rate limits
5. Review error messages for specific issues

## Exit Codes

- **0:** All tests passed
- **1:** One or more tests failed

## Related Documentation

- [Checkpoint 5 Summary](../docs/WHATSAPP_CHECKPOINT_5_SUMMARY.md)
- [WhatsApp Notification System Design](../.kiro/specs/whatsapp-notification-system/design.md)
- [WhatsApp Notification System Requirements](../.kiro/specs/whatsapp-notification-system/requirements.md)
- [Implementation Tasks](../.kiro/specs/whatsapp-notification-system/tasks.md)

## Next Steps

After Checkpoint 5 passes:
1. Proceed to Task 6: Implement Communication Service orchestrator
2. Implement database schema extensions (Task 7)
3. Implement message logging (Task 8)
4. Implement webhook handlers (Tasks 9-10)

---

**Last Updated:** December 28, 2024  
**Version:** 1.0
