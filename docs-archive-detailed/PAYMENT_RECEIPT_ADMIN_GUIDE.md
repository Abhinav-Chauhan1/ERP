# How to Verify Payment Receipts - Administrator Guide

## Overview

This guide provides comprehensive instructions for administrators to review, verify, and manage offline payment receipts submitted by students and parents. The receipt verification system ensures accurate fee payment records while maintaining proper audit trails.

## Prerequisites

- Administrator access to the finance management section
- Understanding of school fee structures and payment policies
- Access to bank statements or payment records for verification (when needed)

## Accessing the Receipt Verification Dashboard

1. Log in to the admin portal
2. Navigate to **Finance** from the main menu
3. Click on **Receipt Verification** in the finance dashboard
4. You'll see the verification dashboard with pending receipts

## Dashboard Overview

### Statistics Cards

At the top of the dashboard, you'll see:
- **Pending Count**: Number of receipts awaiting verification
- **Total Pending Amount**: Sum of all pending receipt amounts
- **Verified Today**: Receipts verified in the current day
- **Rejected Today**: Receipts rejected in the current day

### Tabs

The dashboard has three main tabs:
1. **Pending Verification**: Receipts awaiting your review
2. **Verified**: Successfully verified receipts
3. **Rejected**: Rejected receipts with reasons

## Verifying Payment Receipts

### Step 1: Review Pending Receipts

The pending receipts table displays:
- **Reference Number**: Unique identifier for the receipt
- **Student Name**: Student who submitted the receipt
- **Class/Section**: Student's current class
- **Amount**: Payment amount claimed
- **Payment Date**: Date of payment
- **Submitted On**: When the receipt was uploaded
- **Receipt Thumbnail**: Preview of the uploaded image
- **Actions**: Verify or Reject buttons

**Sorting and Filtering:**
- Receipts are sorted by submission date (oldest first) by default
- Use the search bar to find specific students or reference numbers
- Apply date range filters to view receipts from specific periods

### Step 2: Open Receipt Details

1. Click on any receipt row or the **View Details** button
2. The Receipt Verification Dialog opens with:
   - **Full-size receipt image** (click to zoom, download option available)
   - **Student Information**: Name, admission ID, class, section
   - **Fee Structure Details**: Fee type, total amount, current balance
   - **Payment Details**: Amount, date, method, transaction reference, remarks
   - **Submission Details**: Reference number, submission date

### Step 3: Verify the Receipt

**Verification Checklist:**

Before verifying, ensure:
- [ ] Receipt image is clear and readable
- [ ] Payment amount matches the receipt
- [ ] Payment date is reasonable and matches the receipt
- [ ] Student name or admission ID is visible on the receipt
- [ ] Fee structure matches the payment purpose
- [ ] No duplicate submissions for the same payment
- [ ] Payment method is consistent with the receipt

**To Verify:**
1. Review all details carefully
2. Click the **Verify Payment** button (green)
3. Confirm the verification in the dialog
4. The system will:
   - Create a fee payment record
   - Update the student's fee balance
   - Mark the receipt as VERIFIED
   - Record your user ID and timestamp
   - Send a notification to the student/parent

**What Happens After Verification:**
- The receipt moves to the "Verified" tab
- Student's fee balance is reduced by the payment amount
- A FeePayment record is created with source "RECEIPT_UPLOAD"
- Student/parent receives a notification with updated balance
- The action is logged in the audit trail

### Step 4: Reject a Receipt (If Necessary)

If a receipt cannot be verified, you must reject it with a clear reason.

**Common Rejection Reasons:**
- Receipt image is unclear or unreadable
- Payment amount doesn't match the receipt
- Receipt belongs to a different student
- Duplicate submission
- Receipt is incomplete or cut off
- Payment details are inconsistent
- Receipt appears to be altered or fraudulent
- Wrong fee structure selected

**To Reject:**
1. Click the **Reject Receipt** button (red)
2. The Rejection Dialog opens
3. **Select or enter a rejection reason** (required)
4. Optionally add additional details
5. Click **Confirm Rejection**
6. The system will:
   - Mark the receipt as REJECTED
   - Record your user ID, timestamp, and reason
   - Send a notification to the student/parent with the reason
   - Move the receipt to the "Rejected" tab

**Important Notes:**
- Always provide a clear, specific rejection reason
- Be professional and constructive in your feedback
- Students can upload a new receipt after rejection
- Rejected receipts remain in the system for audit purposes

## Advanced Features

### Bulk Actions (Future Enhancement)

Currently, receipts must be verified individually. Bulk verification features are planned for future releases.

### Search and Filter

**Search by:**
- Student name
- Reference number
- Admission ID

**Filter by:**
- Date range (submission date)
- Payment date range
- Class/section
- Amount range

### Download Receipt Images

1. Open the receipt details dialog
2. Click the **Download** button
3. The receipt image will be downloaded to your device
4. Useful for record-keeping or further investigation

### View Verification History

**For Verified Receipts:**
- Switch to the "Verified" tab
- View who verified each receipt and when
- See the original receipt image
- Check the linked payment record

**For Rejected Receipts:**
- Switch to the "Rejected" tab
- View rejection reasons
- See who rejected and when
- Check if a new receipt was submitted

## Best Practices

### Verification Workflow

1. **Process Oldest First**: The system sorts by submission date (oldest first) to ensure fair processing
2. **Set Aside Time**: Dedicate specific times for receipt verification (e.g., daily at 10 AM and 3 PM)
3. **Batch Processing**: Process multiple receipts in one session for efficiency
4. **Double-Check**: Always verify payment details against the receipt image
5. **Clear Communication**: Provide specific, actionable rejection reasons

### Quality Control

1. **Cross-Reference**: When in doubt, check bank statements or payment logs
2. **Verify Student Identity**: Ensure the receipt belongs to the correct student
3. **Check for Duplicates**: Look for similar amounts and dates in payment history
4. **Validate Amounts**: Ensure amounts are reasonable for the fee structure
5. **Document Issues**: Note any patterns or recurring issues for policy updates

### Security and Compliance

1. **Maintain Confidentiality**: Receipt images contain sensitive financial information
2. **Audit Trail**: All actions are logged with your user ID and timestamp
3. **No Modifications**: Once verified, receipts cannot be modified (contact IT if needed)
4. **Secure Access**: Only authorized finance staff should have verification access
5. **Regular Reviews**: Periodically review verification patterns and accuracy

### Communication

1. **Timely Processing**: Aim to process receipts within 1-3 business days
2. **Clear Rejections**: Always explain why a receipt was rejected
3. **Follow Up**: If you notice recurring issues from a student, reach out proactively
4. **Transparency**: Students can view their receipt status at any time

## Troubleshooting

### Issue: Cannot verify a receipt (button disabled)
**Cause**: Receipt may already be processed or there's a system error  
**Solution**: Refresh the page. If the issue persists, contact IT support.

### Issue: Receipt image won't load
**Cause**: Network issue or storage problem  
**Solution**: Check your internet connection. Try refreshing. Contact IT if the problem continues.

### Issue: Student claims they didn't receive notification
**Cause**: Notification settings or email delivery issue  
**Solution**: Check the student's notification preferences. Verify the email address is correct. Manually inform the student if needed.

### Issue: Duplicate receipts for the same payment
**Cause**: Student submitted multiple times  
**Solution**: Verify one receipt and reject the duplicates with reason "Duplicate submission - already verified under reference [REF-NUMBER]"

### Issue: Receipt amount doesn't match fee structure
**Cause**: Partial payment or wrong fee structure selected  
**Solution**: If it's a valid partial payment, verify it. If wrong structure, reject with clear instructions.

### Issue: Unclear receipt image
**Cause**: Poor photo quality, lighting, or scanning  
**Solution**: Reject with reason "Receipt image is unclear. Please upload a clearer photo with good lighting and all text readable."

## Reporting and Analytics

### Verification Statistics

Access verification statistics from the dashboard:
- Total receipts processed (daily, weekly, monthly)
- Average verification time
- Rejection rate and common reasons
- Pending backlog

### Audit Reports

Generate audit reports for:
- All verifications by date range
- Verifications by specific administrator
- Rejected receipts with reasons
- Payment source breakdown (manual vs. receipt upload vs. online)

### Financial Reports

Receipt verification data integrates with:
- Fee collection reports
- Payment method analysis
- Outstanding balance reports
- Cash flow projections

## Integration with Other Systems

### Fee Payment System

Verified receipts automatically:
- Create FeePayment records
- Update student fee balances
- Appear in payment history
- Count toward collection statistics

### Notification System

Automatic notifications are sent for:
- Receipt verification (includes updated balance)
- Receipt rejection (includes reason)
- Configurable in admin settings

### Audit Logging

All verification actions are logged:
- Who performed the action
- When it was performed
- What action was taken (verify/reject)
- Rejection reason (if applicable)

## Configuration and Settings

### Payment Configuration

Administrators can configure:
- Enable/disable offline receipt verification
- Enable/disable online payments
- Maximum receipt file size
- Allowed file formats
- Auto-notification settings

**To Access:**
1. Go to **Settings** > **Payment Configuration**
2. Toggle payment methods as needed
3. Adjust receipt upload settings
4. Save changes

### Notification Settings

Configure notification preferences:
- Email notifications for new receipts
- Daily digest of pending receipts
- Verification confirmation emails
- Rejection notification templates

## Frequently Asked Questions

### Q: How long should verification take?
**A:** Aim for 1-3 business days. During peak periods (start of term), communicate expected delays to students.

### Q: What if I accidentally verify the wrong receipt?
**A:** Contact IT support immediately. Verified receipts cannot be unverified through the UI, but IT can reverse the action if caught quickly.

### Q: Can I verify a receipt with a partial payment?
**A:** Yes, as long as the amount on the receipt matches what the student entered. Partial payments are allowed.

### Q: What if the receipt is in a foreign language?
**A:** If you cannot read the receipt, reject it with a request for a translated version or additional documentation.

### Q: Should I verify receipts with handwritten amounts?
**A:** Use caution. Verify that handwritten receipts are official (have stamps, signatures) and cross-reference with bank records if possible.

### Q: What if a student disputes a rejection?
**A:** Review the rejection reason and the receipt again. If the rejection was correct, explain the reason clearly. If it was an error, ask them to resubmit.

### Q: Can parents upload receipts?
**A:** Yes, parents can upload receipts for their children through the parent portal.

### Q: How do I handle receipts for scholarships or discounts?
**A:** Verify the net amount paid. The system will handle scholarship adjustments separately in the fee structure.

### Q: What if the receipt date is very old?
**A:** Verify if it's a legitimate late submission. If suspicious, investigate further or reject with a request for explanation.

### Q: Should I verify receipts outside business hours?
**A:** Not required, but the system is available 24/7 if you choose to process receipts outside normal hours.

## Quick Reference

| Task | Steps |
|------|-------|
| Verify Receipt | Finance > Receipt Verification > Click receipt > Verify Payment |
| Reject Receipt | Finance > Receipt Verification > Click receipt > Reject > Enter reason |
| Search Receipt | Use search bar with student name or reference number |
| Download Receipt | Open receipt details > Click Download button |
| View History | Switch to Verified or Rejected tabs |
| Configure Settings | Settings > Payment Configuration |

## Support and Resources

### Getting Help

- **IT Support**: For technical issues with the system
- **Finance Manager**: For policy questions or complex cases
- **Training Materials**: Available in the admin resource center
- **System Updates**: Check announcements for new features

### Training

New administrators should:
1. Review this guide thoroughly
2. Shadow an experienced administrator
3. Process test receipts in a training environment
4. Start with simple cases before handling complex ones

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Contact**: finance-admin@yourschool.edu
