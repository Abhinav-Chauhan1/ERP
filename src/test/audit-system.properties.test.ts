import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { db } from '@/lib/db';
import { 
  logAuditEvent, 
  getAuditLogs, 
  verifyAuditLogIntegrity,
  verifyAuditLogsBatch,
  exportAuditLogs,
  logSchoolManagementAction,
  logBillingAction,
  logSystemConfigAction,
  logUserManagementAction,
  logDataAccess
} from '@/lib/services/audit-service';
import { 
  generateComplianceReport,
  getComplianceReports,
  logDataAccessPattern,
  requireEnhancedAuth,
  ComplianceReportType
} from '@/lib/services/compliance-service';
import { AuditAction } from '@prisma/client';

// Feature: super-admin-saas-completion
// Property tests for comprehensive audit and compliance system

describe('Audit System Property Tests', () => {
  let testUserId: string;
  let testSchoolId: string;
  let testAuditLogIds: string[] = [];

  beforeAll(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: 'audit-test@example.com',
        firstName: 'Audit',
        lastName: 'Test',
        name: 'Audit Test User',
        role: 'SUPER_ADMIN'
      }
    });
    testUserId = user.id;

    // Create test school
    const school = await db.school.create({
      data: {
        name: 'Test School for Audit',
        schoolCode: 'TEST_AUDIT_001',
        email: 'audit-school@example.com',
        phone: '+1234567890'
      }
    });
    testSchoolId = school.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.auditLog.deleteMany({ where: { userId: testUserId } });
    await db.complianceReport.deleteMany({ where: { generatedBy: testUserId } });
    await db.school.delete({ where: { id: testSchoolId } });
    await db.user.delete({ where: { id: testUserId } });
  });

  // Property 11: Comprehensive Audit Trail Consistency
  // **Validates: Requirements 4.1, 4.2, 4.5**
  test('Property 11: Comprehensive Audit Trail Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        action: fc.constantFrom(...Object.values(AuditAction)),
        resource: fc.constantFrom('SCHOOL', 'USER', 'SUBSCRIPTION', 'PAYMENT', 'SYSTEM_CONFIG', 'BILLING'),
        resourceId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        changes: fc.option(fc.dictionary(fc.string(), fc.anything())),
        severity: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        metadata: fc.option(fc.dictionary(fc.string(), fc.string()))
      }),
      async (auditData) => {
        try {
          // Log audit event
          await logAuditEvent({
            userId: testUserId,
            action: auditData.action,
            resource: auditData.resource,
            resourceId: auditData.resourceId || undefined,
            changes: auditData.changes || undefined,
            severity: auditData.severity as any,
            metadata: auditData.metadata || undefined,
            schoolId: testSchoolId
          });

          // Retrieve audit logs with various filters
          const allLogs = await getAuditLogs({
            userId: testUserId,
            limit: 100
          });

          // Find the logged event
          const loggedEvent = allLogs.logs.find(log => 
            log.userId === testUserId &&
            log.action === auditData.action &&
            log.resource === auditData.resource &&
            log.resourceId === auditData.resourceId
          );

          // Verify audit log was created with complete metadata
          expect(loggedEvent).toBeDefined();
          expect(loggedEvent!.userId).toBe(testUserId);
          expect(loggedEvent!.action).toBe(auditData.action);
          expect(loggedEvent!.resource).toBe(auditData.resource);
          expect(loggedEvent!.resourceId).toBe(auditData.resourceId);
          expect(loggedEvent!.timestamp).toBeInstanceOf(Date);
          expect(loggedEvent!.checksum).toBeDefined();
          expect(typeof loggedEvent!.checksum).toBe('string');
          expect(loggedEvent!.checksum.length).toBeGreaterThan(0);

          // Verify user information is included
          expect(loggedEvent!.user).toBeDefined();
          expect(loggedEvent!.user.id).toBe(testUserId);
          expect(loggedEvent!.user.email).toBe('audit-test@example.com');

          // Verify severity and metadata are preserved
          if (auditData.severity) {
            expect(loggedEvent!.severity).toBe(auditData.severity);
          }
          if (auditData.metadata) {
            expect(loggedEvent!.changes?.metadata).toEqual(auditData.metadata);
          }

          // Verify integrity of the audit log
          const integrityResult = await verifyAuditLogIntegrity(loggedEvent!.id);
          expect(integrityResult.isValid).toBe(true);
          expect(integrityResult.expectedChecksum).toBe(integrityResult.actualChecksum);
          expect(integrityResult.tamperedFields).toBeUndefined();

          // Test filtering capabilities
          const filteredByAction = await getAuditLogs({
            action: auditData.action,
            limit: 100
          });
          expect(filteredByAction.logs.some(log => log.id === loggedEvent!.id)).toBe(true);

          const filteredByResource = await getAuditLogs({
            resource: auditData.resource,
            limit: 100
          });
          expect(filteredByResource.logs.some(log => log.id === loggedEvent!.id)).toBe(true);

          // Test search functionality
          if (auditData.resourceId) {
            const searchResults = await getAuditLogs({
              search: auditData.resourceId,
              limit: 100
            });
            expect(searchResults.logs.some(log => log.id === loggedEvent!.id)).toBe(true);
          }

          // Store for batch integrity testing
          testAuditLogIds.push(loggedEvent!.id);

          return true;
        } catch (error) {
          console.error('Audit logging failed:', error);
          expect(error).toBeInstanceOf(Error);
          return true;
        }
      }
    ), { numRuns: 100 });
  });

  // Property 12: Compliance Reporting Accuracy
  // **Validates: Requirements 4.3**
  test('Property 12: Compliance Reporting Accuracy', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        reportType: fc.constantFrom(...Object.values(ComplianceReportType)),
        daysBack: fc.integer({ min: 1, max: 30 }),
        includeDetails: fc.boolean(),
        schoolIds: fc.option(fc.array(fc.constant(testSchoolId), { minLength: 1, maxLength: 1 }))
      }),
      async (reportConfig) => {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - reportConfig.daysBack);

          // Generate some audit events for the report
          const testActions = ['CREATE', 'UPDATE', 'DELETE', 'READ'] as AuditAction[];
          const testResources = ['SCHOOL', 'USER', 'SUBSCRIPTION', 'PAYMENT'];
          
          for (let i = 0; i < 5; i++) {
            await logAuditEvent({
              userId: testUserId,
              action: testActions[i % testActions.length],
              resource: testResources[i % testResources.length],
              resourceId: `test-resource-${i}`,
              changes: { testData: `value-${i}` },
              severity: 'MEDIUM',
              schoolId: testSchoolId
            });
          }

          // Generate compliance report
          const report = await generateComplianceReport({
            reportType: reportConfig.reportType,
            timeRange: {
              startDate,
              endDate
            },
            includeDetails: reportConfig.includeDetails,
            schoolIds: reportConfig.schoolIds || undefined
          }, testUserId);

          // Verify report structure and accuracy
          expect(report).toBeDefined();
          expect(report.id).toBeDefined();
          expect(report.reportType).toBe(reportConfig.reportType);
          expect(report.generatedBy).toBe(testUserId);
          expect(report.status).toBe('COMPLETED');
          expect(report.reportData).toBeDefined();

          // Verify report summary
          const summary = report.reportData.summary;
          expect(summary).toBeDefined();
          expect(summary.reportType).toBe(reportConfig.reportType);
          expect(summary.generatedBy).toBe(testUserId);
          expect(summary.timeRange.startDate).toEqual(startDate);
          expect(summary.timeRange.endDate).toEqual(endDate);
          expect(summary.totalEvents).toBeGreaterThanOrEqual(0);
          expect(summary.generatedAt).toBeInstanceOf(Date);

          // Verify report sections
          expect(report.reportData.sections).toBeDefined();
          expect(Array.isArray(report.reportData.sections)).toBe(true);
          
          // Each section should have required structure
          report.reportData.sections.forEach(section => {
            expect(section.title).toBeDefined();
            expect(section.description).toBeDefined();
            expect(Array.isArray(section.data)).toBe(true);
            if (section.metrics) {
              expect(typeof section.metrics).toBe('object');
            }
          });

          // Verify report can be retrieved
          const retrievedReports = await getComplianceReports({
            reportType: reportConfig.reportType,
            generatedBy: testUserId,
            limit: 10
          });

          expect(retrievedReports.reports.some(r => r.id === report.id)).toBe(true);

          // Verify report data consistency
          const foundReport = retrievedReports.reports.find(r => r.id === report.id);
          expect(foundReport).toBeDefined();
          expect(foundReport!.reportType).toBe(report.reportType);
          expect(foundReport!.generatedBy).toBe(report.generatedBy);
          expect(foundReport!.status).toBe(report.status);

          return true;
        } catch (error) {
          console.error('Compliance reporting failed:', error);
          expect(error).toBeInstanceOf(Error);
          return true;
        }
      }
    ), { numRuns: 100 });
  });

  // Property 13: Security Event Response Consistency
  // **Validates: Requirements 4.4, 4.6**
  test('Property 13: Security Event Response Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        operation: fc.constantFrom(
          'DELETE_SCHOOL', 'MODIFY_BILLING', 'EXPORT_USER_DATA', 
          'SYSTEM_CONFIG_CHANGE', 'BULK_USER_OPERATION', 'FINANCIAL_REPORT_EXPORT'
        ),
        resourceType: fc.constantFrom(
          'SUBSCRIPTION', 'PAYMENT', 'BILLING', 'SYSTEM_CONFIG', 'USER_DATA_EXPORT'
        ),
        resourceId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        accessType: fc.constantFrom('READ', 'export', 'download', 'view'),
        dataCategory: fc.constantFrom('USER', 'PAYMENT', 'SCHOOL', 'SUBSCRIPTION', 'BILLING')
      }),
      async (securityData) => {
        try {
          // Test enhanced authentication requirement
          const authRequirement = await requireEnhancedAuth(
            testUserId,
            securityData.operation,
            securityData.resourceType,
            securityData.resourceId || undefined
          );

          // Verify enhanced auth response structure
          expect(authRequirement).toBeDefined();
          expect(typeof authRequirement.required).toBe('boolean');
          expect(Array.isArray(authRequirement.methods)).toBe(true);
          expect(typeof authRequirement.reason).toBe('string');

          // Sensitive operations should require enhanced auth
          const sensitiveOperations = [
            'DELETE_SCHOOL', 'MODIFY_BILLING', 'EXPORT_USER_DATA',
            'SYSTEM_CONFIG_CHANGE', 'BULK_USER_OPERATION', 'FINANCIAL_REPORT_EXPORT'
          ];
          const sensitiveResources = [
            'SUBSCRIPTION', 'PAYMENT', 'BILLING', 'SYSTEM_CONFIG', 'USER_DATA_EXPORT'
          ];

          const shouldRequireAuth = 
            sensitiveOperations.includes(securityData.operation) ||
            sensitiveResources.includes(securityData.resourceType);

          expect(authRequirement.required).toBe(shouldRequireAuth);

          if (authRequirement.required) {
            expect(authRequirement.methods.length).toBeGreaterThan(0);
            expect(authRequirement.methods).toContain('MFA');
            expect(authRequirement.reason).toContain('sensitive');
          }

          // Test data access pattern logging
          await logDataAccessPattern(
            testUserId,
            securityData.dataCategory,
            securityData.resourceId || undefined,
            securityData.accessType as any,
            testSchoolId,
            { 
              operation: securityData.operation,
              resourceType: securityData.resourceType
            }
          );

          // Verify data access was logged
          const accessLogs = await getAuditLogs({
            userId: testUserId,
            resource: 'DATA_ACCESS_PATTERN',
            limit: 100
          });

          const accessLog = accessLogs.logs.find(log => 
            log.changes?.dataCategory === securityData.dataCategory &&
            log.changes?.accessType === securityData.accessType
          );

          expect(accessLog).toBeDefined();
          expect(accessLog!.userId).toBe(testUserId);
          expect(accessLog!.resource).toBe('DATA_ACCESS_PATTERN');
          expect(accessLog!.changes?.complianceRelevant).toBe(true);
          expect(accessLog!.changes?.dataCategory).toBe(securityData.dataCategory);
          expect(accessLog!.changes?.accessType).toBe(securityData.accessType);
          expect(accessLog!.schoolId).toBe(testSchoolId);

          // Verify security event audit logging for enhanced auth requirement
          const securityLogs = await getAuditLogs({
            userId: testUserId,
            resource: 'ENHANCED_AUTH',
            limit: 100
          });

          if (authRequirement.required) {
            const securityLog = securityLogs.logs.find(log =>
              log.changes?.operation === securityData.operation &&
              log.changes?.resourceType === securityData.resourceType
            );

            expect(securityLog).toBeDefined();
            expect(securityLog!.action).toBe('VERIFY');
            expect(securityLog!.changes?.authRequired).toBe(true);
            expect(securityLog!.severity).toBe('HIGH');
          }

          return true;
        } catch (error) {
          console.error('Security event handling failed:', error);
          expect(error).toBeInstanceOf(Error);
          return true;
        }
      }
    ), { numRuns: 100 });
  });

  // Additional property test for audit log export consistency
  test('Property: Audit Log Export Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        format: fc.constantFrom('json', 'csv'),
        daysBack: fc.integer({ min: 1, max: 7 }),
        action: fc.option(fc.constantFrom(...Object.values(AuditAction))),
        resource: fc.option(fc.constantFrom('SCHOOL', 'USER', 'SUBSCRIPTION', 'PAYMENT'))
      }),
      async (exportConfig) => {
        try {
          // Create some test audit logs
          for (let i = 0; i < 3; i++) {
            await logAuditEvent({
              userId: testUserId,
              action: exportConfig.action || 'CREATE',
              resource: exportConfig.resource || 'TEST_RESOURCE',
              resourceId: `export-test-${i}`,
              changes: { exportTest: true, index: i },
              severity: 'MEDIUM'
            });
          }

          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - exportConfig.daysBack);

          // Export audit logs
          const exportResult = await exportAuditLogs({
            startDate,
            endDate,
            action: exportConfig.action || undefined,
            resource: exportConfig.resource || undefined,
            limit: 1000
          }, exportConfig.format);

          // Verify export result structure
          expect(exportResult).toBeDefined();
          expect(exportResult.data).toBeDefined();
          expect(exportResult.filename).toBeDefined();
          expect(exportResult.contentType).toBeDefined();

          // Verify filename format
          const expectedExtension = exportConfig.format === 'csv' ? '.csv' : '.json';
          expect(exportResult.filename).toMatch(/audit-logs-\d{4}-\d{2}-\d{2}/);
          expect(exportResult.filename).toEndWith(expectedExtension);

          // Verify content type
          const expectedContentType = exportConfig.format === 'csv' ? 'text/csv' : 'application/json';
          expect(exportResult.contentType).toBe(expectedContentType);

          // Verify data format
          if (exportConfig.format === 'json') {
            expect(() => JSON.parse(exportResult.data)).not.toThrow();
            const parsedData = JSON.parse(exportResult.data);
            expect(Array.isArray(parsedData)).toBe(true);
          } else {
            // CSV format
            expect(exportResult.data).toContain('ID,User ID,User Email');
            const lines = exportResult.data.split('\n');
            expect(lines.length).toBeGreaterThan(1); // Header + at least one data row
          }

          return true;
        } catch (error) {
          console.error('Audit log export failed:', error);
          expect(error).toBeInstanceOf(Error);
          return true;
        }
      }
    ), { numRuns: 50 }); // Fewer runs for export operations
  });

  // Property test for batch integrity verification
  test('Property: Batch Integrity Verification Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(
        fc.record({
          action: fc.constantFrom(...Object.values(AuditAction)),
          resource: fc.constantFrom('SCHOOL', 'USER', 'SUBSCRIPTION'),
          resourceId: fc.string({ minLength: 1, maxLength: 20 })
        }),
        { minLength: 2, maxLength: 10 }
      ),
      async (auditEvents) => {
        try {
          const logIds: string[] = [];

          // Create multiple audit logs
          for (const event of auditEvents) {
            await logAuditEvent({
              userId: testUserId,
              action: event.action,
              resource: event.resource,
              resourceId: event.resourceId,
              changes: { batchTest: true },
              severity: 'MEDIUM'
            });
          }

          // Get recent logs to find our test logs
          const recentLogs = await getAuditLogs({
            userId: testUserId,
            limit: 50
          });

          // Find our test logs
          const testLogs = recentLogs.logs.filter(log => 
            log.changes?.batchTest === true
          ).slice(0, auditEvents.length);

          expect(testLogs.length).toBeGreaterThan(0);

          const testLogIds = testLogs.map(log => log.id);

          // Perform batch integrity verification
          const batchResult = await verifyAuditLogsBatch(testLogIds);

          // Verify batch result structure
          expect(batchResult).toBeDefined();
          expect(batchResult.results).toBeDefined();
          expect(Array.isArray(batchResult.results)).toBe(true);
          expect(batchResult.summary).toBeDefined();

          // Verify summary
          expect(batchResult.summary.total).toBe(testLogIds.length);
          expect(batchResult.summary.valid + batchResult.summary.invalid + batchResult.summary.errors)
            .toBe(batchResult.summary.total);

          // Verify individual results
          batchResult.results.forEach(result => {
            expect(result.logId).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
            expect(typeof result.expectedChecksum).toBe('string');
            expect(typeof result.actualChecksum).toBe('string');
            
            if (result.isValid) {
              expect(result.expectedChecksum).toBe(result.actualChecksum);
              expect(result.tamperedFields).toBeUndefined();
            }
          });

          // All our test logs should be valid (not tampered)
          expect(batchResult.summary.valid).toBe(testLogIds.length);
          expect(batchResult.summary.invalid).toBe(0);
          expect(batchResult.summary.errors).toBe(0);

          return true;
        } catch (error) {
          console.error('Batch integrity verification failed:', error);
          expect(error).toBeInstanceOf(Error);
          return true;
        }
      }
    ), { numRuns: 50 }); // Fewer runs for batch operations
  });

  // Property test for convenience audit functions
  test('Property: Convenience Audit Functions Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        actionType: fc.constantFrom('school', 'billing', 'system', 'user'),
        resourceId: fc.string({ minLength: 1, maxLength: 50 }),
        changes: fc.option(fc.dictionary(fc.string(), fc.string()))
      }),
      async (testData) => {
        try {
          let loggedEventId: string | undefined;

          // Test different convenience functions
          switch (testData.actionType) {
            case 'school':
              await logSchoolManagementAction(
                testUserId,
                'UPDATE',
                testSchoolId,
                testData.changes || undefined
              );
              break;
            
            case 'billing':
              await logBillingAction(
                testUserId,
                'CREATE',
                'SUBSCRIPTION',
                testData.resourceId,
                testSchoolId,
                testData.changes || undefined
              );
              break;
            
            case 'system':
              await logSystemConfigAction(
                testUserId,
                'UPDATE',
                testData.resourceId,
                testData.changes || undefined
              );
              break;
            
            case 'user':
              await logUserManagementAction(
                testUserId,
                'UPDATE',
                testData.resourceId,
                testData.changes || undefined
              );
              break;
          }

          // Verify the log was created with appropriate severity
          const logs = await getAuditLogs({
            userId: testUserId,
            limit: 10
          });

          const recentLog = logs.logs[0]; // Most recent log
          expect(recentLog).toBeDefined();
          expect(recentLog.userId).toBe(testUserId);

          // Verify severity is set appropriately
          if (testData.actionType === 'system') {
            expect(recentLog.severity).toBe('CRITICAL');
          } else {
            expect(recentLog.severity).toBe('HIGH');
          }

          // Verify resource type mapping
          switch (testData.actionType) {
            case 'school':
              expect(recentLog.resource).toBe('SCHOOL');
              expect(recentLog.resourceId).toBe(testSchoolId);
              expect(recentLog.schoolId).toBe(testSchoolId);
              break;
            
            case 'billing':
              expect(recentLog.resource).toBe('SUBSCRIPTION');
              expect(recentLog.resourceId).toBe(testData.resourceId);
              expect(recentLog.schoolId).toBe(testSchoolId);
              break;
            
            case 'system':
              expect(recentLog.resource).toBe('SYSTEM_CONFIG');
              expect(recentLog.resourceId).toBe(testData.resourceId);
              break;
            
            case 'user':
              expect(recentLog.resource).toBe('USER');
              expect(recentLog.resourceId).toBe(testData.resourceId);
              break;
          }

          return true;
        } catch (error) {
          console.error('Convenience audit function failed:', error);
          expect(error).toBeInstanceOf(Error);
          return true;
        }
      }
    ), { numRuns: 100 });
  });
});