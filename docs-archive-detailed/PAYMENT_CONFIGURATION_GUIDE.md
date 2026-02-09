# Payment Configuration Guide

## Overview

This guide explains how to configure payment methods for your school's fee collection system. You can enable online payments, offline receipt verification, or both methods to provide flexibility for students and parents.

## Accessing Payment Configuration

1. Log in to the admin portal with super admin privileges
2. Navigate to **Settings** from the main menu
3. Click on the **Payment** tab
4. Click **Configure Payment Methods** button

Alternatively:
- Go to **Settings** > **Payment Configuration** directly

## Configuration Options

### 1. Enable Online Payment

**Description**: Allows students and parents to pay fees directly through an integrated payment gateway.

**Options:**
- **Toggle**: ON/OFF
- **Payment Gateway**: Select from available gateways (Razorpay, Stripe, etc.)

**When Enabled:**
- Students see "Pay Online" button in their fees page
- Parents see "Pay Online" button in their fees overview
- Payments are processed immediately through the gateway
- Automatic payment confirmation and receipt generation
- Real-time balance updates

**When Disabled:**
- Online payment options are hidden from student/parent portals
- Only offline payment methods are available

**Configuration Steps:**
1. Toggle "Enable Online Payment" to ON
2. Select your payment gateway from the dropdown
3. Configure gateway credentials in environment variables
4. Test with a small transaction
5. Save settings

**Requirements:**
- Payment gateway account (Razorpay, Stripe, etc.)
- API credentials configured in environment variables
- SSL certificate for secure transactions
- Bank account for settlement

### 2. Enable Offline Receipt Verification

**Description**: Allows students and parents to upload payment receipts for offline payments (cash, cheque, bank transfer) which administrators can then verify.

**Options:**
- **Toggle**: ON/OFF
- **Max Receipt Size**: File size limit in MB (default: 5MB)
- **Allowed Formats**: Comma-separated list (default: jpg,jpeg,png,pdf)
- **Auto-Notify on Verification**: Send automatic notifications (default: ON)

**When Enabled:**
- Students see "Upload Receipt" button in their fees page
- Parents see "Upload Receipt" button in their fees overview
- Administrators can verify/reject receipts in the finance dashboard
- Automatic notifications on verification/rejection

**When Disabled:**
- Receipt upload options are hidden from student/parent portals
- Existing pending receipts can still be processed
- No new receipts can be uploaded

**Configuration Steps:**
1. Toggle "Enable Offline Receipt Verification" to ON
2. Set maximum receipt file size (recommended: 5MB)
3. Specify allowed file formats (jpg, jpeg, png, pdf)
4. Enable/disable auto-notifications
5. Save settings

**Requirements:**
- Cloudinary account for image storage
- Cloudinary credentials in environment variables
- Administrator access for verification
- Notification system configured (email/in-app)

### 3. Receipt Upload Settings

#### Maximum Receipt Size

**Description**: Maximum file size allowed for receipt uploads.

**Options:**
- Range: 1MB to 10MB
- Default: 5MB
- Recommended: 5MB

**Considerations:**
- Larger files take longer to upload
- Storage costs increase with larger files
- Most phone cameras produce 2-4MB images
- PDFs can be larger than images

**Best Practice**: 5MB is sufficient for high-quality photos and scanned documents.

#### Allowed Receipt Formats

**Description**: File formats accepted for receipt uploads.

**Options:**
- jpg, jpeg (JPEG images)
- png (PNG images)
- pdf (PDF documents)

**Default**: jpg,jpeg,png,pdf

**Considerations:**
- JPEG: Most common, good compression, smaller file sizes
- PNG: Higher quality, larger file sizes, supports transparency
- PDF: Good for scanned documents, can contain multiple pages

**Best Practice**: Allow all formats (jpg,jpeg,png,pdf) for maximum flexibility.

#### Auto-Notify on Verification

**Description**: Automatically send notifications when receipts are verified or rejected.

**Options:**
- Toggle: ON/OFF
- Default: ON

**When Enabled:**
- Students/parents receive immediate notification on verification
- Rejection notifications include the reason
- Notifications include updated balance information

**When Disabled:**
- No automatic notifications are sent
- Users must check receipt status manually
- Administrators can still manually notify users

**Best Practice**: Keep enabled for better user experience and transparency.

## Configuration Scenarios

### Scenario 1: Online Payments Only

**Use Case**: Modern school with digital infrastructure, wants to minimize manual processing.

**Configuration:**
- Enable Online Payment: ON
- Payment Gateway: Razorpay/Stripe
- Enable Offline Receipt Verification: OFF

**Benefits:**
- Instant payment processing
- No manual verification needed
- Automatic reconciliation
- Real-time balance updates

**Considerations:**
- Requires payment gateway account
- Transaction fees apply
- Some families may prefer offline payments

### Scenario 2: Offline Receipts Only

**Use Case**: School not ready for online payments, wants to digitize receipt management.

**Configuration:**
- Enable Online Payment: OFF
- Enable Offline Receipt Verification: ON
- Max Receipt Size: 5MB
- Allowed Formats: jpg,jpeg,png,pdf
- Auto-Notify: ON

**Benefits:**
- No payment gateway fees
- Maintains existing payment processes
- Digital record-keeping
- Audit trail for all payments

**Considerations:**
- Requires manual verification by administrators
- Processing time: 1-3 business days
- Depends on administrator availability

### Scenario 3: Both Methods Enabled (Recommended)

**Use Case**: Flexible school offering multiple payment options to accommodate all families.

**Configuration:**
- Enable Online Payment: ON
- Payment Gateway: Razorpay/Stripe
- Enable Offline Receipt Verification: ON
- Max Receipt Size: 5MB
- Allowed Formats: jpg,jpeg,png,pdf
- Auto-Notify: ON

**Benefits:**
- Maximum flexibility for families
- Accommodates different preferences
- Reduces barriers to payment
- Maintains digital records for all methods

**Considerations:**
- Requires both systems to be configured
- Administrators must monitor receipt verification
- Slightly more complex for users (more options)

### Scenario 4: Neither Method Enabled

**Use Case**: Temporary configuration during system maintenance or transition.

**Configuration:**
- Enable Online Payment: OFF
- Enable Offline Receipt Verification: OFF

**Result:**
- No payment options available to students/parents
- Warning message displayed in fee pages
- Manual payment recording by administrators only

**When to Use:**
- System maintenance
- Payment gateway migration
- Policy changes in progress
- Emergency situations

**Important**: Communicate with families before disabling all payment methods.

## Testing Your Configuration

### Before Going Live

1. **Test Online Payments** (if enabled):
   - Make a small test transaction
   - Verify payment confirmation
   - Check balance update
   - Confirm receipt generation
   - Test refund process

2. **Test Receipt Upload** (if enabled):
   - Upload a test receipt as a student
   - Verify as an administrator
   - Check notification delivery
   - Confirm balance update
   - Test rejection workflow

3. **Test User Experience**:
   - Log in as student and verify options are visible
   - Log in as parent and verify options are visible
   - Ensure disabled options are hidden
   - Check warning messages when no methods are enabled

### Monitoring After Launch

1. **Track Metrics**:
   - Payment success rate (online)
   - Receipt verification time (offline)
   - Rejection rate and reasons
   - User adoption of each method

2. **Gather Feedback**:
   - Survey students and parents
   - Interview administrators
   - Monitor support tickets
   - Review common issues

3. **Optimize Settings**:
   - Adjust file size limits if needed
   - Update allowed formats based on usage
   - Refine notification templates
   - Improve rejection reason templates

## Security Considerations

### Online Payments

- **PCI Compliance**: Payment gateway handles sensitive card data
- **SSL/TLS**: Ensure HTTPS is enabled for all payment pages
- **API Keys**: Store gateway credentials securely in environment variables
- **Webhooks**: Validate webhook signatures from payment gateway
- **Fraud Detection**: Monitor for suspicious transaction patterns

### Receipt Uploads

- **File Validation**: System validates file type and size
- **Secure Storage**: Receipts stored in Cloudinary with encryption
- **Access Control**: Only student/parent and administrators can view receipts
- **Audit Trail**: All verification actions are logged
- **Data Retention**: Define retention policy for receipt images

### General Security

- **Role-Based Access**: Only super admins can change payment configuration
- **Audit Logging**: All configuration changes are logged
- **Regular Reviews**: Periodically review access logs and settings
- **Backup**: Ensure payment data is included in backups

## Troubleshooting

### Issue: Online payment option not showing
**Possible Causes:**
- Online payment is disabled in configuration
- Payment gateway credentials not configured
- User doesn't have permission to make payments

**Solution:**
1. Check payment configuration settings
2. Verify environment variables for gateway credentials
3. Test with a different user account
4. Check browser console for errors

### Issue: Receipt upload option not showing
**Possible Causes:**
- Offline verification is disabled in configuration
- Cloudinary credentials not configured
- User doesn't have permission to upload receipts

**Solution:**
1. Check payment configuration settings
2. Verify Cloudinary credentials in environment variables
3. Test with a different user account
4. Check browser console for errors

### Issue: Receipt upload fails
**Possible Causes:**
- File size exceeds limit
- File format not allowed
- Network connectivity issue
- Cloudinary storage quota exceeded

**Solution:**
1. Check file size and format
2. Verify max size and allowed formats in configuration
3. Test with a smaller file
4. Check Cloudinary dashboard for quota
5. Review server logs for errors

### Issue: Notifications not being sent
**Possible Causes:**
- Auto-notify is disabled
- Email service not configured
- User email address is invalid
- Notification queue is backed up

**Solution:**
1. Check auto-notify setting in configuration
2. Verify email service credentials
3. Check user's email address in their profile
4. Review notification logs
5. Test with a different user

## Best Practices

### Configuration Management

1. **Document Changes**: Keep a log of configuration changes and reasons
2. **Test Before Deploying**: Always test in a staging environment first
3. **Communicate Changes**: Inform users before changing payment methods
4. **Gradual Rollout**: Consider phased rollout for major changes
5. **Monitor Impact**: Track metrics after configuration changes

### User Communication

1. **Advance Notice**: Give users at least 1 week notice before changes
2. **Clear Instructions**: Provide guides for new payment methods
3. **Support Availability**: Ensure support staff are trained on new methods
4. **FAQ Updates**: Update FAQs when configuration changes
5. **Feedback Channels**: Provide ways for users to report issues

### Administrator Training

1. **Receipt Verification**: Train administrators on verification process
2. **Common Issues**: Document common problems and solutions
3. **Escalation Process**: Define when to escalate issues
4. **Quality Standards**: Set standards for verification decisions
5. **Regular Reviews**: Periodically review verification quality

## Frequently Asked Questions

### Q: Can I enable both payment methods?
**A:** Yes, enabling both provides maximum flexibility for families.

### Q: What happens to pending receipts if I disable offline verification?
**A:** Pending receipts can still be processed by administrators. Only new uploads are prevented.

### Q: Can I change the file size limit after receipts are uploaded?
**A:** Yes, but it only affects new uploads. Existing receipts are not affected.

### Q: Do I need both a payment gateway and Cloudinary?
**A:** Only if you enable both methods. Online payments need a gateway, offline receipts need Cloudinary.

### Q: How do I handle the transition from offline to online payments?
**A:** Enable both methods during transition, gradually encourage online payments, disable offline after adoption.

### Q: What if neither payment method is enabled?
**A:** Users will see a warning message. Administrators can still manually record payments.

### Q: Can students choose which method to use?
**A:** Yes, if both are enabled, students can choose their preferred method.

### Q: How do I know which method is more popular?
**A:** Check the finance dashboard for payment source breakdown statistics.

### Q: Can I set different methods for different fee types?
**A:** Not currently. Configuration applies to all fee types. This is a planned future enhancement.

### Q: What's the recommended configuration for most schools?
**A:** Enable both methods for maximum flexibility, with 5MB file size limit and all formats allowed.

## Support and Resources

### Getting Help

- **Technical Support**: For system configuration issues
- **Finance Team**: For payment policy questions
- **Training Materials**: Available in admin resource center
- **Documentation**: Refer to student and admin guides

### Related Documentation

- [Student Guide: How to Upload Payment Receipts](./PAYMENT_RECEIPT_STUDENT_GUIDE.md)
- [Admin Guide: How to Verify Payment Receipts](./PAYMENT_RECEIPT_ADMIN_GUIDE.md)
- [Payment Receipt FAQ](./PAYMENT_RECEIPT_FAQ.md)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Contact**: admin-support@yourschool.edu
