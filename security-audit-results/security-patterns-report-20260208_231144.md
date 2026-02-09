# Security Anti-Pattern Audit Report
Generated: Sun Feb  8 11:11:44 PM IST 2026

## Console Logging Statements
**Severity:** MEDIUM
**Description:** Console statements can leak sensitive information in production

```
```

**Total occurrences:** 0

---

## Dangerous HTML Injection
**Severity:** HIGH
**Description:** Using dangerouslySetInnerHTML can lead to XSS vulnerabilities

```
src/app/teacher/teaching/lessons/[id]/page.tsx:427:                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content).replace(/\n/g, '<br/>') }} />
src/app/admin/certificates/templates/[id]/preview/page.tsx:105:                                dangerouslySetInnerHTML={{ __html: (previewHtml as unknown) as string }}
src/app/student/academics/materials/[id]/page.tsx:139:                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }} />
src/components/parent/communication/message-detail.tsx:198:            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
src/components/student/lesson-viewer.tsx:366:          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
src/components/student/lesson-viewer.tsx:479:            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content) }} />
src/components/student/lesson-content.tsx:40:              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

**Total occurrences:** 7

---

## Eval Usage
**Severity:** CRITICAL
**Description:** eval() can execute arbitrary code and is a major security risk

```
```

**Total occurrences:** 0

---

## Raw SQL Queries
**Severity:** HIGH
**Description:** Raw SQL queries can be vulnerable to SQL injection

```
```

**Total occurrences:** 0

---

## Hardcoded Secrets
**Severity:** CRITICAL
**Description:** Hardcoded secrets should be moved to environment variables

```
```

**Total occurrences:** 0

---

## innerHTML Assignment
**Severity:** HIGH
**Description:** Direct innerHTML assignment can lead to XSS vulnerabilities

```
```

**Total occurrences:** 0

---

## Unvalidated Redirects
**Severity:** MEDIUM
**Description:** Unvalidated redirects can be used for phishing attacks

```
```

**Total occurrences:** 0

---

## Missing Error Handling
**Severity:** MEDIUM
**Description:** Async functions without try-catch can cause unhandled rejections

```
```

**Total occurrences:** 0

---

## Weak Password Requirements
**Severity:** HIGH
**Description:** Password requirements should enforce minimum 8 characters

```
```

**Total occurrences:** 0

---

## Missing CSRF Protection
**Severity:** HIGH
**Description:** State-changing operations should have CSRF protection

```
```

**Total occurrences:** 0

---

## Potential Unescaped User Input
**Severity:** MEDIUM
**Description:** User input should be properly escaped to prevent XSS

```
```

**Total occurrences:** 0

---

## Missing Authentication Checks
**Severity:** CRITICAL
**Description:** API routes should verify authentication

```
```

**Total occurrences:** 0

---

## Insecure Random Number Generation
**Severity:** MEDIUM
**Description:** Use crypto.randomBytes() for security-sensitive random values

```
src/app/api/otp/generate/route.ts:82:    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
src/components/ui/accessibility.tsx:274:  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
src/components/ui/accessibility.tsx:491:  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
src/components/ui/report-builder.tsx:305:              row[fieldId] = Math.floor(Math.random() * 1000) + 1;
src/components/ui/report-builder.tsx:308:              row[fieldId] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
src/components/ui/report-builder.tsx:311:              row[fieldId] = Math.random() > 0.5;
src/components/upload/r2-document-upload.tsx:196:      const fileId = `${Date.now()}-${Math.random()}`;
src/components/upload/r2-upload-widget.tsx:211:        id: `${Date.now()}-${Math.random()}`,
src/components/parent/common/toast-examples.tsx:63:        Math.random() > 0.5 ? resolve('Success!') : reject('Failed!');
src/components/student/study-tools/mind-map-creator.tsx:99:      id: Math.random().toString(36).substr(2, 9),
src/components/student/study-tools/mind-map-creator.tsx:101:      x: parentNode.x + (Math.random() - 0.5) * 200,
src/components/student/study-tools/mind-map-creator.tsx:102:      y: parentNode.y + (Math.random() - 0.5) * 200,
src/components/student/study-tools/mind-map-creator.tsx:103:      color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
src/components/student/study-tools/flashcard-system.tsx:111:    const shuffledCards = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
src/components/student/study-tools/flashcard-system.tsx:134:        id: Math.random().toString(36).substr(2, 9),
src/lib/utils/retry.ts:68:    const jitter = delay * 0.25 * Math.random();
src/lib/utils/background-export.ts:176:  return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
src/lib/utils/comprehensive-logging.ts:551:      const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
src/lib/utils/rate-limit.ts:58:    if (Math.random() < 0.01) {
src/lib/utils/auto-grading.test.ts:214:              if (Math.random() > 0.5) {
src/lib/utils/auto-grading.test.ts:223:                    wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
src/lib/utils/file-security.ts:201:  const randomString = Math.random().toString(36).substring(2, 15);
src/lib/utils/certificate-template-utils.ts:243:  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
src/lib/utils/certificate-template-utils.ts:253:  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
src/lib/services/system-integration-service.ts:562:    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
src/lib/services/certificateGenerationService.ts:50:  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
src/lib/services/certificateGenerationService.ts:59:  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
src/lib/services/r2-error-notification-service.ts:216:    const id = `r2_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
src/lib/services/support-service.ts:1344:    const random = Math.floor(Math.random() * 1000).toString().padStart(SUPPORT_CONSTANTS.TICKET_NUMBER.RANDOM_DIGITS, '0')
src/lib/services/r2-performance-monitoring-service.ts:117:    if (Math.random() > this.config.samplingRate) return;
src/lib/services/threshold-monitoring-service.ts:608:      const value = Math.random() * 100; // Placeholder calculation
src/lib/services/threshold-monitoring-service.ts:699:    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
src/lib/services/rate-limiting-service.ts:156:      const requestId = `${now}-${Math.random()}`;
src/lib/services/rate-limiting-service.ts:445:      await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
src/lib/services/school-notification-settings-service.ts:448:    const deliveryTime = Math.floor(Math.random() * 3000) + 500; // 500-3500ms
src/lib/services/school-data-management-service.ts:360:            size: BigInt(Math.floor(Math.random() * 500000000) + 100000000),
src/lib/middleware/rate-limit.ts:117:    const requestId = `${now}-${Math.random()}`;
src/lib/middleware/enhanced-error-handler.ts:341:  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
src/lib/middleware/auth-audit-logger.ts:534:    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
src/lib/actions/teacherSubjectsActions.ts:296:        completedTopics: Math.floor(Math.random() * 8), // Simplified - would be tracked in the database
src/lib/actions/teacherSubjectsActions.ts:297:        status: Math.random() > 0.7 ? "completed" : Math.random() > 0.3 ? "in-progress" : "not-started",
src/lib/actions/teacherSubjectsActions.ts:298:        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
src/lib/actions/admissionConversionActions.ts:14:  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
src/lib/actions/admissionConversionActions.ts:25:    password += chars.charAt(Math.floor(Math.random() * chars.length));
src/lib/actions/auth-actions.ts:238:  if (Math.random() < 0.01) {
src/lib/actions/studentExamActions.ts:222:      questions = questions.sort(() => Math.random() - 0.5);
src/lib/actions/onlineExamActions.ts:405:    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
src/lib/actions/admissionActions.ts:16:  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
src/test/api/super-admin-analytics.integration.test.ts:497:          usage: Math.floor(Math.random() * 10000),
src/test/api/super-admin-analytics.integration.test.ts:498:          schools: Math.floor(Math.random() * 9500),
src/test/login-endpoint.properties.test.ts:307:        if (Math.random() < 0.5) {
src/test/school-management.properties.test.ts:324:              schoolCode: `${schoolData.schoolCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
src/test/e2e/cross-browser-mobile.test.ts:284:    return Math.random() > 0.2; // 80% chance of passing
src/test/e2e/cross-browser-mobile.test.ts:360:        const supportedFeatures = jsFeatures.filter(() => Math.random() > 0.1); // 90% support rate
src/test/e2e/cross-browser-mobile.test.ts:388:        const supportedCssFeatures = cssFeatures.filter(() => Math.random() > 0.05); // 95% support rate
src/test/e2e/cross-browser-mobile.test.ts:416:        const consistentElements = uiElements.filter(() => Math.random() > 0.1); // 90% consistency
src/test/e2e/cross-browser-mobile.test.ts:503:        const supportedTouchFeatures = touchFeatures.filter(() => Math.random() > 0.1); // 90% support
src/test/e2e/cross-browser-mobile.test.ts:597:      const supportedFeatures = tableFeatures.filter(() => Math.random() > 0.05); // 95% support
src/test/e2e/cross-browser-mobile.test.ts:634:      const supportedFeatures = chartFeatures.filter(() => Math.random() > 0.1); // 90% support
src/test/e2e/cross-browser-mobile.test.ts:671:      const supportedFeatures = formFeatures.filter(() => Math.random() > 0.05); // 95% support
src/test/e2e/cross-browser-mobile.test.ts:742:      const supportedFeatures = keyboardFeatures.filter(() => Math.random() > 0.05); // 95% support
src/test/e2e/performance-load.test.ts:211:            offset: Math.floor(Math.random() * 100),
src/test/e2e/performance-load.test.ts:245:            schoolId: `test-school-${Date.now()}-${Math.random()}`,
src/test/e2e/performance-load.test.ts:353:            page: Math.floor(Math.random() * 10) + 1,
src/test/e2e/performance-load.test.ts:448:            Math.random() * 1000,
src/test/e2e/performance-load.test.ts:567:          const randomOperation = operations[Math.floor(Math.random() * operations.length)];
src/test/otp-generate-integration.test.ts:18:    testMobile = `98765${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
src/test/otp-generate-integration.test.ts:24:        schoolCode: `TEST${Math.floor(Math.random() * 10000)}`,
src/test/otp-generate-integration.test.ts:155:        schoolCode: `ANOTHER${Math.floor(Math.random() * 10000)}`,
src/test/otp-generate-integration.test.ts:283:    const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
src/test/monitoring-system.properties.test.ts:144:        const userIndex = Math.floor(Math.random() * testUserIds.length);
src/test/monitoring-system.properties.test.ts:334:                resolved: Math.random() > 0.7, // 30% resolved
src/test/monitoring-system.properties.test.ts:335:                createdAt: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
src/test/otp-generate-endpoint.properties.test.ts:62:            const expirationMinutes = 2 + Math.random() * 3; // 2-5 minutes
src/test/permission-system.properties.test.ts:133:        const hasRolePermission = userData.role !== 'SUPER_ADMIN' && Math.random() > 0.5;
src/test/permission-system.properties.test.ts:139:        const hasUserPermission = !hasRolePermission && Math.random() > 0.5;
src/test/security/csrf-rate-limit-integration.test.ts:289:          'x-forwarded-for': `192.168.1.${Math.floor(Math.random() * 255)}`, // Unique IP
src/test/security/csrf-rate-limit-integration.test.ts:290:          'user-agent': `test-agent-${Math.random()}`
src/test/security/csrf-rate-limit-integration.test.ts:348:      'x-forwarded-for': `192.168.1.${Math.floor(Math.random() * 255)}`, // Unique IP
src/test/security/csrf-rate-limit-integration.test.ts:349:      'user-agent': `test-agent-${Math.random()}`,
src/test/ui-integration.test.tsx:922:        studentCount: Math.floor(Math.random() * 1000) + 100,
src/test/data-management-system.properties.test.ts:41:    id: `backup-${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:42:    name: `Test Backup ${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:43:    type: (['FULL', 'INCREMENTAL', 'DIFFERENTIAL'] as BackupType[])[Math.floor(Math.random() * 3)],
src/test/data-management-system.properties.test.ts:45:    enabled: Math.random() > 0.5,
src/test/data-management-system.properties.test.ts:46:    retentionDays: Math.floor(Math.random() * 365) + 1,
src/test/data-management-system.properties.test.ts:48:    excludeSchemas: Math.random() > 0.5 ? ['TempData'] : undefined,
src/test/data-management-system.properties.test.ts:49:    encryptionEnabled: Math.random() > 0.5,
src/test/data-management-system.properties.test.ts:50:    compressionEnabled: Math.random() > 0.5,
src/test/data-management-system.properties.test.ts:57:  const type = (['TIME_BASED', 'COUNT_BASED', 'SIZE_BASED'] as RetentionPolicyType[])[Math.floor(Math.random() * 3)];
src/test/data-management-system.properties.test.ts:60:    id: `retention-${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:61:    name: `Test Retention ${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:63:    enabled: Math.random() > 0.5,
src/test/data-management-system.properties.test.ts:64:    retentionDays: type === 'TIME_BASED' ? Math.floor(Math.random() * 365) + 1 : undefined,
src/test/data-management-system.properties.test.ts:65:    maxCount: type === 'COUNT_BASED' ? Math.floor(Math.random() * 1000) + 1 : undefined,
src/test/data-management-system.properties.test.ts:66:    maxSizeBytes: type === 'SIZE_BASED' ? Math.floor(Math.random() * 1000000000) + 1 : undefined,
src/test/data-management-system.properties.test.ts:75:    format: (['JSON', 'CSV', 'XML', 'SQL'] as DataExportFormat[])[Math.floor(Math.random() * 4)],
src/test/data-management-system.properties.test.ts:84:    requestType: (['ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY', 'RESTRICTION'] as GDPRRequestType[])[Math.floor(Math.random() * 5)],
src/test/data-management-system.properties.test.ts:85:    subjectId: `user-${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:86:    subjectEmail: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
src/test/data-management-system.properties.test.ts:97:    name: `Test Migration ${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:99:    version: `1.${Math.floor(Math.random() * 10)}.0`,
src/test/data-management-system.properties.test.ts:102:        id: `step-${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:112:        id: `rollback-${Math.random().toString(36).substr(2, 9)}`,
src/test/data-management-system.properties.test.ts:120:    createdBy: `admin-${Math.random().toString(36).substr(2, 9)}`,
```

**Total occurrences:** 105

---

## Missing Input Validation
**Severity:** HIGH
**Description:** All user inputs should be validated

```
```

**Total occurrences:** 0

---

## Environment Variable Usage
**Severity:** INFO
**Description:** Review environment variable usage for sensitive data

```
```

**Total occurrences:** 0

---


## Summary

Scan completed at: Sun Feb  8 11:11:46 PM IST 2026

### Severity Breakdown

- **CRITICAL:** 0
0 issues
- **HIGH:** 0
0 issues
- **MEDIUM:** 0
0 issues
- **LOW:** 0
0 issues

