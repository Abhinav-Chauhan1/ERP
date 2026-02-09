# Receipt Audit Log System - User Guide

## Overview

The Receipt Audit Log system provides comprehensive tracking of all receipt-related actions in the offline payment receipt system. This feature ensures accountability, compliance, and helps with debugging and support.

## Features

### 1. Comprehensive Action Tracking

All receipt-related actions are automatically logged:

- **UPLOAD** - When a student/parent uploads a new receipt
- **REUPLOAD** - When a receipt is re-uploaded after rejection
- **VERIFY** - When an admin verifies a receipt
- **REJECT** - When an admin rejects a receipt
- **BULK_VERIFY** - When multiple receipts are verified at once
- **BULK_REJECT** - When multiple receipts are rejected at once
- **ADD_NOTE** - When an admin adds a note to a receipt
- **DELETE_NOTE** - When an admin deletes a note
- **VIEW** - When someone views a receipt (optional)
- **EXPORT** - When receipt data is exported

### 2. Audit Log Viewer

Access the audit log viewer at: `/admin/finance/receipt-audit-logs`

**Features:**
- View all receipt-related actions in chronological order
- Filter by action type
- Filter by date range
- Search by user, email, or receipt reference
- Pagination (50 logs per page)
- Export to CSV

### 3. Information Captured

Each audit log entry includes:

- **Timestamp** - Exact date and time of action
- **Action** - Type of action performed
- **User** - Who performed the action (name, email, role)
- **Receipt** - Receipt reference number and ID
- **Details** - Action-specific details:
  - Amount (for financial actions)
  - Rejection reason (for rejections)
  - Success/failure counts (for bulk operations)
  - Note preview (for note actions)
- **IP Address** - User's IP address (optional)
- **User Agent** - Browser/device information (optional)

## How to Use

### Accessing Audit Logs

1. **From Receipt Verification Page:**
   - Click "Audit Logs" button in the header
   - Opens audit log viewer

2. **From Verification Dialog:**
   - Click "View Audit Log" button in dialog footer
   - Opens in new tab

3. **Direct URL:**
   - Navigate to `/admin/finance/receipt-audit-logs`

### Filtering Logs

1. **By Action Type:**
   - Select action from dropdown
   - Click "Apply Filters"

2. **By Date Range:**
   - Enter start date
   - Enter end date
   - Click "Apply Filters"

3. **By Search:**
   - Type user name, email, or receipt reference
   - Results filter automatically

4. **Clear Filters:**
   - Click "Clear Filters" button
   - Resets all filters

### Exporting Logs

1. Apply desired filters (optional)
2. Click "Export CSV" button
3. CSV file downloads automatically
4. Filename format: `receipt-audit-logs-YYYY-MM-DD.csv`

**Export includes:**
- Timestamp
- Action
- User (name, email, role)
- Receipt ID
- Reference number
- Details (JSON format)
- IP address
- User agent

## Use Cases

### 1. Compliance & Auditing

**Scenario:** External auditor needs proof of all receipt verifications

**Solution:**
1. Go to audit logs page
2. Filter by action: "VERIFY" or "BULK_VERIFY"
3. Set date range for audit period
4. Export to CSV
5. Provide CSV to auditor

### 2. Investigating Issues

**Scenario:** Student claims receipt was rejected without reason

**Solution:**
1. Go to audit logs page
2. Search for student's name or receipt reference
3. Find REJECT action
4. View rejection reason in details column
5. Verify admin who rejected and timestamp

### 3. Tracking Admin Activity

**Scenario:** Monitor which admins are processing receipts

**Solution:**
1. Go to audit logs page
2. Filter by action: "VERIFY" or "REJECT"
3. Set date range (e.g., last 7 days)
4. Review user column to see admin activity
5. Export for reporting

### 4. Debugging Bulk Operations

**Scenario:** Bulk verification partially failed

**Solution:**
1. Go to audit logs page
2. Filter by action: "BULK_VERIFY"
3. Find the operation in question
4. Check success/failure counts in details
5. Identify which receipts failed

### 5. Note History

**Scenario:** Need to see all notes added to a receipt

**Solution:**
1. Go to audit logs page
2. Search for receipt reference number
3. Filter by action: "ADD_NOTE"
4. View all notes with timestamps and authors

## Security & Privacy

### Access Control

- **Admin Only** - Only users with ADMIN role can view audit logs
- **API Protection** - All API endpoints require authentication
- **Authorization Checks** - User role verified on every request

### Data Retention

- Audit logs are stored indefinitely
- No automatic deletion
- Manual cleanup requires database access

### Privacy Considerations

- IP addresses are optional (can be disabled)
- User agents are optional (can be disabled)
- Personal data (names, emails) included for accountability
- Export should be handled securely

## Technical Details

### Database Schema

```prisma
model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  action     AuditAction
  resource   String      // "PAYMENT_RECEIPT"
  resourceId String
  changes    Json        // Action-specific details
  ipAddress  String?
  userAgent  String?
  timestamp  DateTime    @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([resource, resourceId])
  @@index([userId])
  @@index([timestamp])
}

enum AuditAction {
  UPLOAD
  REUPLOAD
  VERIFY
  REJECT
  BULK_VERIFY
  BULK_REJECT
  ADD_NOTE
  DELETE_NOTE
  VIEW
  EXPORT
}
```

### API Endpoints

**GET /api/admin/receipt-audit-logs**
- Fetch audit logs with filters
- Query params: action, startDate, endDate, limit, offset
- Returns: { success, logs, totalCount, hasMore }

**GET /api/admin/receipt-audit-logs/export**
- Export audit logs to CSV
- Query params: action, startDate, endDate
- Returns: CSV file download

### Performance

- Pagination: 50 logs per page
- Export limit: 10,000 records
- Database indexes on resource, userId, timestamp
- Efficient queries with filters

## Best Practices

### 1. Regular Monitoring

- Check audit logs weekly
- Look for unusual patterns
- Verify admin activity

### 2. Export for Records

- Export monthly for archival
- Store exports securely
- Include in compliance reports

### 3. Investigate Anomalies

- Unusual bulk operations
- High rejection rates
- Off-hours activity

### 4. Use Filters Effectively

- Narrow down by action type first
- Add date range for specific periods
- Use search for specific receipts/users

### 5. Document Findings

- Note any issues discovered
- Track resolution actions
- Update procedures if needed

## Troubleshooting

### Issue: Audit logs not appearing

**Possible Causes:**
- Action not integrated with audit service
- Audit logging failed silently
- Database connection issue

**Solution:**
- Check server logs for errors
- Verify audit service is called in action
- Test with a new action

### Issue: Export not working

**Possible Causes:**
- Too many records (>10,000)
- Browser blocking download
- API timeout

**Solution:**
- Add more filters to reduce records
- Check browser download settings
- Try smaller date range

### Issue: Search not finding results

**Possible Causes:**
- Typo in search query
- Case sensitivity
- Record doesn't exist

**Solution:**
- Check spelling
- Try partial search
- Verify record exists in database

## FAQ

**Q: How long are audit logs kept?**
A: Indefinitely. They are not automatically deleted.

**Q: Can audit logs be edited or deleted?**
A: No. Audit logs are immutable for compliance.

**Q: Who can view audit logs?**
A: Only users with ADMIN role.

**Q: Are all actions logged?**
A: Yes, all receipt-related actions are logged automatically.

**Q: Can I export all audit logs?**
A: Yes, but limited to 10,000 records per export. Use filters for larger datasets.

**Q: What if audit logging fails?**
A: The main operation continues. Audit failures are logged but don't block actions.

**Q: Can I see who viewed a receipt?**
A: VIEW action logging is optional and may not be enabled.

**Q: How do I find logs for a specific receipt?**
A: Search by receipt reference number in the search box.

**Q: Can I filter by user?**
A: Not directly in UI, but you can search by user name or email.

**Q: What's the difference between VERIFY and BULK_VERIFY?**
A: VERIFY is for single receipts, BULK_VERIFY is for multiple receipts at once.

## Support

For issues or questions about the audit log system:

1. Check this guide first
2. Review server logs for errors
3. Contact system administrator
4. Email: support@yourschool.edu

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2024  
**Author:** System Administrator
