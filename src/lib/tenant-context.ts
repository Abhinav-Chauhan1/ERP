export type TenantContextType = {
    schoolId: string;
    isSuperAdmin: boolean;
};

// Next.js build safe way to get AsyncLocalStorage
const getAsyncLocalStorage = () => {
    // Only import in Node.js environment
    if (typeof window === 'undefined') {
        const async_hooks = require('async_hooks');
        return new async_hooks.AsyncLocalStorage();
    }

    // In browser, return a dummy implementation that won't crash
    // but the actual context should be provided by React Context anyway
    return {
        run: (store: any, callback: () => any) => callback(),
        getStore: () => undefined,
        enterWith: () => { },
        disable: () => { }
    } as any;
};

export const tenantContext = getAsyncLocalStorage();

/**
 * Sentinel schoolId for super-admin cross-tenant (global) queries.
 * When used, the RLS middleware skips schoolId injection so the query
 * runs across all schools — valid only for super-admin aggregate reads.
 */
export const SUPER_ADMIN_GLOBAL = '__super_admin_global__';

/**
 * Run a function with a specific tenant context
 */
export function runWithTenantContext<T>(
    context: TenantContextType,
    callback: () => T
): T {
    return tenantContext.run(context, callback);
}

/**
 * Run a super-admin function that must query across all schools.
 * Bypasses the per-school RLS filter — only use for read-only
 * aggregate/analytics queries in super-admin server actions.
 */
export function runWithSuperAdminContext<T>(callback: () => T): T {
    return tenantContext.run({ schoolId: SUPER_ADMIN_GLOBAL, isSuperAdmin: true }, callback);
}

/**
 * Get the current tenant context.
 * Returns undefined if no context is set.
 */
export function getTenantContext(): TenantContextType | undefined {
    return tenantContext.getStore();
}

/**
 * Get the current school ID from context.
 * Throws an error if no context is set and we're not a SUPER_ADMIN.
 */
export function getRequireSchoolId(): string {
    const context = tenantContext.getStore();

    if (!context) {
        throw new Error('No tenant context found. This operation requires a schoolId.');
    }

    if (context.isSuperAdmin) {
        // Super admins might not have a school ID in their context if they are acting globally
        // But if we're calling get*Require*SchoolId, we strictly need one, or it's an error in usage
        if (!context.schoolId) {
            throw new Error('Super Admin attempting to perform an operation that requires a specific schoolId, but no schoolId is in context.');
        }
    }

    if (!context.schoolId) {
        throw new Error('Tenant context is active but missing schoolId.');
    }

    return context.schoolId;
}
