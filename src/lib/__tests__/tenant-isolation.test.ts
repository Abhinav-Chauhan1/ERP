import { describe, it, expect } from 'vitest';
import { injectTenantContextToArgs } from '@/lib/db';

describe('Prisma Multi-Tenant Extension Logic', () => {

    describe('when adding schoolId context to queries', () => {
        it('should inject schoolId to findMany queries', () => {
            const schoolId = 'test-school-123';
            const initialArgs = { where: { name: 'Class 1' } };

            const args = injectTenantContextToArgs('findMany', initialArgs, schoolId);

            expect(args.where.schoolId).toBe(schoolId);
            expect(args.where.name).toBe('Class 1');
        });

        it('should inject schoolId to create operations', () => {
            const schoolId = 'test-school-123';
            const initialArgs = { data: { name: 'Class 1', academicYearId: 'ay1' } };

            const args = injectTenantContextToArgs('create', initialArgs, schoolId);

            expect(args.data.schoolId).toBe(schoolId);
            expect(args.data.name).toBe('Class 1');
        });

        it('should inject schoolId to createMany operations (array)', () => {
            const schoolId = 'test-school-123';
            const initialArgs = { data: [{ name: 'Class 1' }, { name: 'Class 2' }] };

            const args = injectTenantContextToArgs('createMany', initialArgs, schoolId);

            expect(args.data[0].schoolId).toBe(schoolId);
            expect(args.data[1].schoolId).toBe(schoolId);
        });

        it('should inject schoolId to upsert operations', () => {
            const schoolId = 'test-school-123';
            const initialArgs = {
                where: { id: 'class1' },
                create: { name: 'Class 1' },
            };

            const args = injectTenantContextToArgs('upsert', initialArgs, schoolId);

            expect(args.where.schoolId).toBe(schoolId);
            expect(args.create.schoolId).toBe(schoolId);
        });
    });
});
