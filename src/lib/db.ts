import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantContext, SUPER_ADMIN_GLOBAL } from './tenant-context';

declare global {
  var db: PrismaClient | undefined;
}

// Models that have a schoolId but should NOT be subject to automatic RLS because
// they are intentionally cross-tenant or have nullable schoolId with service-level filtering.
const RLS_EXEMPT_MODELS = new Set(['AuditLog']);

// Generate the list of models that have a schoolId field for RLS
export const tenantModels = Prisma.dmmf.datamodel.models
  .filter(model => model.fields.some(f => f.name === 'schoolId') && !RLS_EXEMPT_MODELS.has(model.name))
  .map(model => model.name);

export const injectTenantContextToArgs = (operation: string, args: any, currentSchoolId: string) => {
  const safeArgs: any = args || {};

  if (
    operation === 'findUnique' ||
    operation === 'findUniqueOrThrow' ||
    operation === 'findFirst' ||
    operation === 'findFirstOrThrow' ||
    operation === 'findMany' ||
    operation === 'count' ||
    operation === 'aggregate' ||
    operation === 'groupBy' ||
    operation === 'update' ||
    operation === 'updateMany' ||
    operation === 'delete' ||
    operation === 'deleteMany'
  ) {
    safeArgs.where = { ...(safeArgs.where || {}), schoolId: currentSchoolId };
  } else if (operation === 'upsert') {
    safeArgs.where = { ...(safeArgs.where || {}), schoolId: currentSchoolId };
    safeArgs.create = { ...(safeArgs.create || {}), schoolId: currentSchoolId };
  } else if (operation === 'create') {
    safeArgs.data = { ...(safeArgs.data || {}), schoolId: currentSchoolId };
  } else if (operation === 'createMany') {
    if (Array.isArray(safeArgs.data)) {
      safeArgs.data = safeArgs.data.map((d: any) => ({ ...d, schoolId: currentSchoolId }));
    } else {
      safeArgs.data = { ...(safeArgs.data || {}), schoolId: currentSchoolId };
    }
  }

  return safeArgs;
};

const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !tenantModels.includes(model)) {
            return query(args);
          }

          let context = getTenantContext();

          if (!context) {
            try {
              const { auth } = await import('@/auth');
              const session = await auth();
              if (session?.user) {
                context = {
                  schoolId: session.user.schoolId as string,
                  isSuperAdmin: session.user.role === 'SUPER_ADMIN'
                };
              }
            } catch (error: any) { }
          }

          // Last-resort fallback: unstable_cache and similar async boundaries sever
          // AsyncLocalStorage AND make auth() unavailable (no request headers).
          // If the call site already baked a schoolId into the WHERE/data args
          // (e.g. cachedQuery passes schoolId as a typed argument), extract and
          // trust it — the value came from application code, not user input.
          if (!context) {
            const safeArgs = args as any;
            const argsSchoolId =
              safeArgs?.where?.schoolId ||
              safeArgs?.data?.schoolId ||
              (Array.isArray(safeArgs?.data) ? safeArgs.data[0]?.schoolId : undefined);

            if (argsSchoolId && typeof argsSchoolId === 'string') {
              context = { schoolId: argsSchoolId, isSuperAdmin: false };
            }
          }

          if (!context) {
            throw new Error(
              `[RLS] No tenant context for model "${model}". ` +
              'Wrap the call in runWithTenantContext() or ensure a valid session is active.'
            );
          }

          // Super-admin without a scoped schoolId — allow cross-tenant reads.
          // Covers both explicit runWithSuperAdminContext() (schoolId = SUPER_ADMIN_GLOBAL)
          // and session-fallback paths where AsyncLocalStorage context is unavailable
          // (schoolId = null/undefined) — both are safe because the role is already
          // verified as SUPER_ADMIN by the auth layer.
          if (context.isSuperAdmin && (!context.schoolId || context.schoolId === SUPER_ADMIN_GLOBAL)) {
            return query(args);
          }

          const currentSchoolId = context.schoolId;
          const safeArgs = injectTenantContextToArgs(operation, args, currentSchoolId);

          return query(safeArgs);
        }
      }
    }
  });
};

// Configure Prisma with connection pooling
export const db = globalThis.db || (createPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') globalThis.db = db;

// Export prisma as an alias for db for backward compatibility
export const prisma = db;
