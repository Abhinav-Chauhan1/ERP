/**
 * Integration test for permission and audit services
 * This verifies that the services can be imported and instantiated correctly
 */

import { describe, it, expect } from 'vitest';
import { permissionService } from '@/lib/services/permission-service';
import { logAuditEvent } from '@/lib/services/audit-service';

describe('Services Integration', () => {
  it('should import permission service correctly', () => {
    expect(permissionService).toBeDefined();
    expect(typeof permissionService.getAllPermissions).toBe('function');
    expect(typeof permissionService.enforceApiPermission).toBe('function');
    expect(typeof permissionService.createPermissionSet).toBe('function');
  });

  it('should import audit service correctly', () => {
    expect(logAuditEvent).toBeDefined();
    expect(typeof logAuditEvent).toBe('function');
  });

  it('should have proper error classes available', async () => {
    const { PermissionError, PermissionNotFoundError } = await import('@/lib/services/permission-service');
    
    expect(PermissionError).toBeDefined();
    expect(PermissionNotFoundError).toBeDefined();
    
    const error = new PermissionError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('PermissionError');
  });
});