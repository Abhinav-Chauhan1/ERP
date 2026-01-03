# Receipt Notification System Implementation

## Overview

This document describes the implementation of the notification system for payment receipt verification. The system sends notifications to students and parents when receipts are verified or rejected by administrators.

## Requirements Addressed

- **Requirement 9.1**: Notify users when receipts are verified
- **Requirement 9.2**: Notify users when receipts are rejected with reason
- **Requirement 9.3**: Use user's preferred notification method (email, in-app, or both)
- **Requirement 9.4**: Display receipt notifications in student/parent portals
- **Requirement 9.5**: Include receipt reference number and updated balance in notifications

## Implementation Components

### 1. Notification Templates (`src/lib/templates/receipt-notification-templates.ts`)

Created comprehensive email and in-app notification templates for both verification success and rejection scenarios.

#### Features:
- **Email Templates**: Professional HTML and plain text email templates with:
  - Branded header with gradient colors
  - Clear status badges (verified/rejected)
  - Detailed receipt information in formatted boxes
  - Amount and balance displayed in Indian Rupee format
  - Action buttons linking to relevant pages
  - Responsive design for mobile devices

- **In-App Notification Templates**: Concise messages for the notification center with:
  - Receipt reference number
  - Fee structure name
  - Amount and balance information
  - Appropriate notification type (RECEIPT_VERIFIED/RECEIPT_REJECTED)
  - Direct links to relevant pages

#### Template Functions:
- `getVerificationSuccessEmailTemplate()`: Email template for verified receipts
- `getRejectionEmailTemplate()`: Email template for rejected receipts
- `getVerificationSuccessNotification()`: In-app notification for verified receipts
- `getRejectionNotification()`: In-app notification for rejected receipts

### 2. Notification Service (`src/lib/services/receipt-notification-service.ts`)

Created a dedicated service for sending receipt-related notifications with support for multiple delivery methods.

#### Features:
- **Multi-Channel Delivery**: Sends notifications via both email and in-app channels
- **User Preferences**: Respects user's notification preferences from UserSettings
- **Graceful Degradation**: Continues operation even if one notification method fails
- **Parent Notification**: Automatically notifies parents when their child's receipt status changes
- **Error Handling**: Logs errors without blocking the verification/rejection operation

#### Service Functions:
- `sendVerificationSuccessNotification()`: Send verification success notifications
- `sendRejectionNotification()`: Send rejection notifications
- `notifyParentIfApplicable()`: Send notifications to parents if applicable

### 3. Updated Verification Actions (`src/lib/actions/receiptVerificationActions.ts`)

Enhanced the existing verification and rejection actions to integrate with the new notification service.

#### Changes:
- **Verification Action**: After successful verification, sends notifications to both student and parent
- **Rejection Action**: After rejection, sends notifications with rejection reason to both student and parent
- **Transaction Safety**: Notifications are sent after database transactions complete to avoid blocking
- **Error Resilience**: Notification failures are logged but don't cause the verification/rejection to fail

### 4. Updated UI Components

#### Student Notification List (`src/components/student/communication/notification-list.tsx`)
- Added support for `RECEIPT_VERIFIED` notification type with green checkmark icon
- Added support for `RECEIPT_REJECTED` notification type with red X icon
- Notifications are clickable and link to appropriate pages

#### Parent Notification List (`src/components/parent/communication/notification-list.tsx`)
- Added `RECEIPT_VERIFIED` to notification icons with CheckCheck icon
- Added `RECEIPT_REJECTED` to notification icons with AlertCircle icon
- Added color schemes for receipt notifications (green for verified, red for rejected)

#### Notification Utilities (`src/lib/utils/notification-utils.ts`)
- Added `getReceiptNotificationIcon()`: Returns appropriate icon for receipt notifications
- Added `getReceiptNotificationColor()`: Returns appropriate color for receipt notifications
- Added `createReceiptVerificationNotification()`: Helper to create verification notifications
- Added `createReceiptRejectionNotification()`: Helper to create rejection notifications

## Notification Flow

### Verification Success Flow
```
1. Admin verifies receipt in admin dashboard
2. Database transaction completes (payment created, balance updated)
3. Notification service is called with receipt data
4. System checks user's notification preferences
5. In-app notification is created in database
6. Email notification is sent (if email is configured and enabled)
7. Parent is notified (if applicable)
8. User sees notification in their portal
9. Clicking notification navigates to receipt details page
```

### Rejection Flow
```
1. Admin rejects receipt with reason in admin dashboard
2. Database update completes (status changed to REJECTED)
3. Notification service is called with rejection data
4. System checks user's notification preferences
5. In-app notification is created with rejection reason
6. Email notification is sent with detailed rejection reason
7. Parent is notified (if applicable)
8. User sees notification in their portal
9. Clicking notification navigates to upload receipt page
```

## Notification Content

### Verification Success Notification

**Email Subject**: `Payment Receipt Verified - RCP-YYYYMMDD-XXXX`

**Email Content**:
- Congratulatory message
- Receipt reference number
- Fee structure name
- Payment date
- Amount paid (formatted in INR)
- Remaining balance (formatted in INR)
- Conditional message based on remaining balance
- Link to view receipt details

**In-App Notification**:
- Title: "Payment Receipt Verified"
- Message: Includes receipt reference, fee structure, amount, and remaining balance
- Type: RECEIPT_VERIFIED
- Link: `/student/fees/receipts`

### Rejection Notification

**Email Subject**: `Payment Receipt Rejected - RCP-YYYYMMDD-XXXX`

**Email Content**:
- Rejection notice
- Receipt reference number
- Fee structure name
- Payment date
- Amount
- Rejection reason (prominently displayed)
- Action required section with guidelines
- Link to upload new receipt

**In-App Notification**:
- Title: "Payment Receipt Rejected"
- Message: Includes receipt reference, fee structure, and rejection reason
- Type: RECEIPT_REJECTED
- Link: `/student/fees/upload-receipt`

## User Preferences

The system respects user notification preferences stored in the `UserSettings` table:
- `emailNotifications`: Controls whether email notifications are sent
- `inAppNotifications`: Controls whether in-app notifications are created

Default behavior (if preferences not set):
- Both email and in-app notifications are enabled
- At least one notification method must succeed for the operation to be considered successful

## Error Handling

The notification system implements robust error handling:

1. **Email Service Not Configured**: Logs warning and continues with in-app notification only
2. **Email Delivery Failure**: Logs error but doesn't fail the operation
3. **In-App Notification Failure**: Logs error but continues with email notification
4. **Parent Not Found**: Not considered an error, operation continues normally
5. **All Notifications Fail**: Logs error but doesn't block the verification/rejection operation

## Testing

### Unit Tests
Created comprehensive unit tests for notification templates:
- Template generation with all required fields
- Conditional content based on remaining balance
- Proper formatting of amounts in Indian Rupee format
- Correct notification types and links

**Test File**: `src/lib/templates/__tests__/receipt-notification-templates.test.ts`

**Test Results**: All 7 tests passing
- ✓ Email template generation for verification
- ✓ Email template generation for rejection
- ✓ In-app notification generation for verification
- ✓ In-app notification generation for rejection
- ✓ Conditional messages based on balance
- ✓ Action required sections in rejection emails

## Configuration

### Environment Variables Required

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourschool.com

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=https://yourschool.com
```

### Email Service Setup

The system uses Resend for email delivery. To enable email notifications:

1. Sign up for a Resend account at https://resend.com
2. Obtain your API key from the Resend dashboard
3. Add the API key to your `.env` file
4. Configure the sender email address
5. Verify your domain in Resend (for production)

If email service is not configured, the system will:
- Log a warning message
- Continue with in-app notifications only
- Not fail the verification/rejection operation

## Future Enhancements

1. **SMS Notifications**: Add SMS notification support for urgent updates
2. **Push Notifications**: Implement web push notifications for real-time updates
3. **Notification Preferences UI**: Allow users to customize notification preferences per notification type
4. **Notification Templates Management**: Admin interface to customize email templates
5. **Notification History**: Track notification delivery status and history
6. **Batch Notifications**: Support for bulk notification sending
7. **Notification Scheduling**: Schedule notifications for specific times
8. **Rich Notifications**: Add images and attachments to notifications

## Maintenance

### Monitoring
- Monitor email delivery rates in Resend dashboard
- Check application logs for notification failures
- Track notification preferences usage

### Troubleshooting

**Issue**: Users not receiving email notifications
- Check if RESEND_API_KEY is configured
- Verify EMAIL_FROM is set correctly
- Check user's email address is valid
- Review Resend dashboard for delivery status
- Check user's notification preferences

**Issue**: In-app notifications not appearing
- Verify notification was created in database
- Check user's notification preferences
- Ensure notification type is supported in UI
- Clear browser cache and reload

**Issue**: Parent not receiving notifications
- Verify parent is linked to student in database
- Check parent's user account exists
- Verify parent's email address is valid
- Check parent's notification preferences

## Security Considerations

1. **Email Content**: Emails contain sensitive financial information - ensure HTTPS is used for all links
2. **PII Protection**: Receipt images and payment details are not included in email notifications
3. **Link Security**: All links in emails use absolute URLs with HTTPS
4. **Rate Limiting**: Consider implementing rate limiting for notification sending to prevent abuse
5. **Email Validation**: Validate email addresses before sending notifications

## Performance Considerations

1. **Async Processing**: Notifications are sent after database transactions complete
2. **Non-Blocking**: Notification failures don't block verification/rejection operations
3. **Batch Processing**: Consider implementing batch notification processing for high volume
4. **Caching**: User preferences could be cached to reduce database queries
5. **Queue System**: For production, consider using a message queue (e.g., Bull, BullMQ) for notification processing

## Compliance

- **GDPR**: Users can control notification preferences
- **CAN-SPAM**: Emails include clear sender information and purpose
- **Data Retention**: Notification records follow the same retention policy as other system data
- **Privacy**: Sensitive information (receipt images) is not included in notifications

## Summary

The receipt notification system provides a comprehensive, multi-channel notification solution that:
- Keeps users informed about receipt verification status
- Respects user preferences for notification delivery
- Provides detailed information in a user-friendly format
- Handles errors gracefully without blocking operations
- Supports both students and parents
- Includes professional email templates with responsive design
- Integrates seamlessly with existing notification infrastructure

The implementation successfully addresses all requirements (9.1, 9.2, 9.3, 9.4, 9.5) and provides a solid foundation for future enhancements.
