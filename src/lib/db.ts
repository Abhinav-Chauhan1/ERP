import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantContext } from './tenant-context';

declare global {
  var db: PrismaClient | undefined;
}

// Generate the list of models that have a schoolId field for RLS
export const tenantModels = Prisma.dmmf.datamodel.models
  .filter(model => model.fields.some(f => f.name === 'schoolId'))
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

          if (!context || (context.isSuperAdmin && !context.schoolId)) {
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
