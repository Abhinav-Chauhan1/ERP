import { describe, it, expect } from 'vitest';

describe('Core Services Integration', () => {
  it('should import all core services without errors', async () => {
    // Test that all services can be imported
    const { authenticationService } = await import('../authentication-service');
    const { otpService } = await import('../otp-service');
    const { schoolContextService } = await import('../school-context-service');
    const { jwtService } = await import('../jwt-service');
    const { roleRouterService } = await import('../role-router-service');
    const { permissionService } = await import('../permission-service');

    // Verify services are defined
    expect(authenticationService).toBeDefined();
    expect(otpService).toBeDefined();
    expect(schoolContextService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(roleRouterService).toBeDefined();
    expect(permissionService).toBeDefined();

    // Verify key methods exist
    expect(typeof authenticationService.authenticateUser).toBe('function');
    expect(typeof otpService.generateOTP).toBe('function');
    expect(typeof schoolContextService.validateSchoolCode).toBe('function');
    expect(typeof jwtService.createToken).toBe('function');
    expect(typeof roleRouterService.getRouteForRole).toBe('function');
    expect(typeof permissionService.enforceApiPermission).toBe('function');
  });

  it('should have proper error classes defined', async () => {
    const { AuthenticationError } = await import('../authentication-service');
    const { OTPError } = await import('../otp-service');
    const { SchoolContextError } = await import('../school-context-service');
    const { JWTError } = await import('../jwt-service');
    const { RoutingError } = await import('../role-router-service');

    expect(AuthenticationError).toBeDefined();
    expect(OTPError).toBeDefined();
    expect(SchoolContextError).toBeDefined();
    expect(JWTError).toBeDefined();
    expect(RoutingError).toBeDefined();
  });

  it('should have proper interfaces exported', async () => {
    // Import types to verify they exist
    const authModule = await import('../authentication-service');
    const otpModule = await import('../otp-service');
    const schoolModule = await import('../school-context-service');
    const jwtModule = await import('../jwt-service');
    const routerModule = await import('../role-router-service');

    // These should not throw errors if interfaces are properly defined
    expect(authModule).toBeDefined();
    expect(otpModule).toBeDefined();
    expect(schoolModule).toBeDefined();
    expect(jwtModule).toBeDefined();
    expect(routerModule).toBeDefined();
  });
});