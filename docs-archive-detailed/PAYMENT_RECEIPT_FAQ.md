# Payment Receipt System - Frequently Asked Questions

## General Questions

### What is the payment receipt system?
The payment receipt system allows students and parents to upload proof of offline payments (cash, cheque, bank transfer) through the online portal. Administrators can then review and verify these receipts, automatically updating fee balances.

### Why do I need to upload a receipt?
Uploading a receipt creates a digital record of your offline payment, speeds up the verification process, and ensures your payment is properly recorded in the system.

### Is the receipt upload system secure?
Yes, all receipt images are stored securely with encryption in cloud storage. Only you and authorized administrators can view your receipts.

### What payment methods can I upload receipts for?
You can upload receipts for:
- Cash payments
- Cheque payments
- Bank transfers
- Any offline payment method accepted by your school

## For Students and Parents

### How do I upload a receipt?

**Students:**
1. Go to Fees & Payments > Upload Receipt
2. Fill in payment details
3. Upload your receipt image
4. Submit

**Parents:**
1. Go to Fees > Upload Receipt
2. Select your child (if you have multiple children)
3. Fill in payment details
4. Upload receipt image
5. Submit

See the [Student Guide](./PAYMENT_RECEIPT_STUDENT_GUIDE.md) for detailed instructions.

### What file formats are accepted?
The system accepts:
- JPEG images (.jpg, .jpeg)
- PNG images (.png)
- PDF documents (.pdf)

### What's the maximum file size?
The default maximum file size is 5MB. This is sufficient for high-quality photos and scanned documents.

### How do I take a good receipt photo?
Tips for a clear receipt image:
- Use good lighting (natural light is best)
- Keep the receipt flat
- Ensure all text is in focus
- Include all corners of the receipt
- Avoid shadows and glare
- Make sure all information is readable

### Can I upload multiple receipts at once?
No, you need to upload each receipt separately with its own payment details.

### How long does verification take?
Typically 1-3 business days. During peak periods (start of term), it may take longer. You'll receive a notification when your receipt is processed.

### How do I check my receipt status?
Go to Fees & Payments > Receipt History. You'll see all your uploaded receipts with their current status.

### What do the different statuses mean?

**Pending Verification (⏱️)**
- Your receipt is awaiting administrator review
- No action needed from you
- Check back in 1-3 business days

**Verified (✓)**
- Your payment has been approved
- Your fee balance has been updated
- You'll receive a confirmation notification

**Rejected (✗)**
- Your receipt could not be verified
- Check the rejection reason
- You can upload a new receipt with corrections

### What if my receipt is rejected?
1. Read the rejection reason carefully
2. Address the specific issue mentioned
3. Upload a new receipt with corrections
4. Contact administration if you need clarification

Common rejection reasons:
- Receipt image is unclear
- Payment details don't match
- Receipt belongs to a different student
- Duplicate submission

### Can I edit a receipt after uploading?
No, once uploaded, receipts cannot be edited. If you made a mistake, contact the administration immediately.

### Can I delete an uploaded receipt?
No, receipts cannot be deleted once uploaded. If you uploaded incorrectly, contact administration.

### Will my fee balance update immediately?
No, your balance updates only after an administrator verifies your receipt. This typically takes 1-3 business days.

### What if I don't have a receipt?
Contact the school administration. They may be able to manually record your payment with proper verification.

### Can I upload a receipt for a partial payment?
Yes, you can upload receipts for partial payments. Just enter the exact amount you paid.

### What if I made a payment but forgot to get a receipt?
Contact the place where you made the payment (bank, school office) and request a duplicate receipt or payment confirmation.

### Can my parents upload receipts for me?
Yes, parents can upload receipts for their children through the parent portal.

### Do I need to keep the original receipt?
Yes, keep the original physical receipt until your uploaded receipt is verified. After verification, keep it for your records.

### What if the receipt is in a different language?
Upload the receipt as-is. If the administrator cannot verify it, they may request a translation or additional documentation.

### Can I upload a screenshot of a digital receipt?
Yes, as long as it's in an accepted format (JPEG, PNG, PDF) and all information is clearly visible.

### What information should be visible on the receipt?
The receipt should show:
- Payment amount
- Payment date
- Payment method
- Recipient (school name or account)
- Any transaction reference numbers
- Ideally, your name or student ID

### What if my receipt has multiple payments on it?
Upload the receipt for each payment separately, entering the specific amount for each fee structure.

### How do I get a reference number?
You'll receive a unique reference number immediately after successfully uploading a receipt. Save this number for tracking.

### Can I track my receipt using the reference number?
Yes, you can search for your receipt using the reference number in the Receipt History page.

### What if I uploaded the wrong file?
Contact administration immediately. They can reject the incorrect receipt, and you can upload the correct one.

### Will I receive a notification when my receipt is processed?
Yes, you'll receive a notification when your receipt is verified or rejected. Enable email notifications in your settings to receive updates via email.

### Can I download my uploaded receipt?
Yes, you can view and download your receipt from the Receipt History page by clicking on the receipt.

### What if the upload fails?
Common solutions:
- Check your file size (must be under 5MB)
- Verify file format (JPEG, PNG, or PDF)
- Check your internet connection
- Try compressing the image
- Try a different browser

### Can I upload receipts from my phone?
Yes, the system works on mobile devices. You can take a photo with your phone and upload it directly.

### What if I paid in cash and don't have a receipt?
Request a receipt from the school office when making cash payments. If you already paid without a receipt, contact the administration.

## For Administrators

### How do I access the receipt verification dashboard?
Go to Finance > Receipt Verification in the admin portal.

### How do I verify a receipt?
1. Click on a pending receipt
2. Review the receipt image and details
3. Click "Verify Payment"
4. Confirm the verification

See the [Admin Guide](./PAYMENT_RECEIPT_ADMIN_GUIDE.md) for detailed instructions.

### What should I check before verifying?
- Receipt image is clear and readable
- Payment amount matches the receipt
- Student information is correct
- No duplicate submissions
- Payment date is reasonable
- Fee structure matches the payment purpose

### How do I reject a receipt?
1. Click on the receipt
2. Click "Reject Receipt"
3. Enter a clear, specific rejection reason
4. Confirm the rejection

### What are good rejection reasons?
Be specific and constructive:
- ✓ "Receipt image is too dark to read. Please upload a clearer photo."
- ✓ "Payment amount ($100) doesn't match receipt ($150). Please verify."
- ✗ "Bad image" (too vague)
- ✗ "Wrong" (not helpful)

### Can I undo a verification?
Not through the UI. Contact IT support immediately if you verified incorrectly.

### How do I handle duplicate receipts?
Verify one and reject the others with reason: "Duplicate submission - already verified under reference [REF-NUMBER]"

### What if I'm not sure about a receipt?
- Cross-reference with bank statements
- Check payment history for duplicates
- Consult with the finance manager
- Contact the student/parent for clarification
- When in doubt, reject with a request for more information

### How do I download a receipt image?
Open the receipt details dialog and click the Download button.

### Can I verify receipts in bulk?
Not currently. Each receipt must be verified individually. Bulk verification is planned for future releases.

### How do I search for a specific receipt?
Use the search bar to search by student name, reference number, or admission ID.

### What reports are available?
- Verification statistics (pending, verified, rejected counts)
- Verification history by date range
- Rejection reasons analysis
- Payment source breakdown

### How do I configure payment methods?
Go to Settings > Payment Configuration. You need super admin privileges.

### What if Cloudinary storage is full?
Contact IT support to increase storage quota or implement archival policies.

### How do I train new administrators?
- Review the [Admin Guide](./PAYMENT_RECEIPT_ADMIN_GUIDE.md)
- Shadow an experienced administrator
- Process test receipts in a training environment
- Start with simple cases

## Technical Questions

### What happens when a receipt is verified?
The system automatically:
1. Creates a FeePayment record
2. Updates the student's fee balance
3. Marks the receipt as VERIFIED
4. Records the administrator's ID and timestamp
5. Sends a notification to the student/parent

### What happens when a receipt is rejected?
The system:
1. Marks the receipt as REJECTED
2. Records the administrator's ID, timestamp, and reason
3. Sends a notification to the student/parent with the reason
4. Allows the student to upload a new receipt

### Where are receipt images stored?
Receipt images are stored securely in Cloudinary cloud storage with encryption and access control.

### How long are receipts kept?
Receipts are kept indefinitely for audit purposes. Schools may implement archival policies for old receipts.

### Can receipts be modified after upload?
No, receipts are immutable once uploaded. This ensures data integrity and audit trail.

### What's the audit trail?
Every verification and rejection action is logged with:
- Administrator user ID
- Timestamp
- Action taken (verify/reject)
- Rejection reason (if applicable)

### How are notifications sent?
Notifications are sent through:
- In-app notifications (always)
- Email (if user has email notifications enabled)
- Configurable in admin settings

### What if the notification system fails?
Verification/rejection still completes successfully. Notifications are sent asynchronously and failures don't block the main process.

### How is security handled?
- Authentication required for all actions
- Role-based access control
- Encrypted storage for receipt images
- Audit logging for all actions
- HTTPS for all communications

### What browsers are supported?
The system works on all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Is there a mobile app?
Not currently. The web interface is mobile-responsive and works on phones and tablets.

### What if I encounter a bug?
Report bugs to IT support with:
- Description of the issue
- Steps to reproduce
- Screenshots if applicable
- Browser and device information

## Configuration Questions

### Can I enable both online and offline payments?
Yes, enabling both provides maximum flexibility for families.

### What's the recommended configuration?
Enable both online payments and offline receipt verification with:
- Max file size: 5MB
- Allowed formats: jpg, jpeg, png, pdf
- Auto-notifications: ON

### Can I change settings after going live?
Yes, but communicate changes to users in advance. Settings changes take effect immediately.

### What if I disable offline verification?
- New receipts cannot be uploaded
- Existing pending receipts can still be processed
- Verified/rejected receipts remain accessible

### What if I disable online payments?
- Online payment options are hidden
- Existing payment history remains accessible
- Users must use offline methods

### What if I disable both methods?
Users will see a warning message that no payment methods are available. Administrators can still manually record payments.

### How do I test configuration changes?
1. Make changes in a staging environment first
2. Test with a small group of users
3. Monitor for issues
4. Roll out to all users

### Can I set different methods for different fee types?
Not currently. Configuration applies to all fee types. This is a planned future enhancement.

## Troubleshooting

### Upload fails with "File too large"
Compress your image or reduce the file size to under 5MB.

### Upload fails with "Invalid file format"
Convert your file to JPEG, PNG, or PDF format.

### Can't see upload receipt option
Check if offline verification is enabled in payment configuration.

### Can't see pay online option
Check if online payment is enabled in payment configuration.

### Receipt status not updating
Refresh the page. If the issue persists, contact IT support.

### Notification not received
Check your notification preferences and email address in your profile settings.

### Receipt image won't load
Check your internet connection. Try refreshing the page. Contact IT support if the issue continues.

### Can't find my receipt
Use the search function with your reference number or check the date range filter.

## Getting Help

### Who do I contact for help?

**Students/Parents:**
- Technical issues: IT Support
- Payment questions: Finance Office
- Policy questions: Administration

**Administrators:**
- Technical issues: IT Support
- Policy questions: Finance Manager
- Training: Admin Resource Center

### Where can I find more information?
- [Student Guide](./PAYMENT_RECEIPT_STUDENT_GUIDE.md)
- [Admin Guide](./PAYMENT_RECEIPT_ADMIN_GUIDE.md)
- [Configuration Guide](./PAYMENT_CONFIGURATION_GUIDE.md)
- School website help section
- Contact support

### How do I report a problem?
1. Check this FAQ first
2. Try the troubleshooting steps
3. Contact the appropriate support team
4. Provide details: what happened, when, screenshots

### Is there training available?
Yes:
- Student orientation materials
- Parent information sessions
- Administrator training workshops
- Online help resources

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Need more help?** Contact support@yourschool.edu
