import { prisma, faker, log } from './helpers';

export async function seedSupportAndPermissions(schoolId: string, adminUserId: string, teacherUserIds: string[]) {
    log('🎫', 'Creating support and permissions data...');
    // Permissions (from existing seed-permissions logic)
    const permResources = ['students', 'teachers', 'classes', 'subjects', 'exams', 'assignments', 'attendance', 'fees', 'reports', 'settings'];
    const permActions: Array<'CREATE' | 'READ' | 'UPDATE' | 'DELETE'> = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    const permIds: string[] = [];
    for (const res of permResources) {
        for (const action of permActions) {
            const p = await prisma.permission.create({
                data: { name: `${res}:${action.toLowerCase()}`, resource: res, action, category: res, description: `${action} ${res}`, isActive: true },
            });
            permIds.push(p.id);
        }
    }

    // Role permissions (ADMIN gets all, TEACHER gets some)
    const roles: Array<'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'> = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
    for (const role of roles) {
        const count = role === 'ADMIN' ? permIds.length : role === 'TEACHER' ? 20 : role === 'STUDENT' ? 5 : 5;
        for (let i = 0; i < count; i++) {
            await prisma.rolePermission.create({ data: { role, permissionId: permIds[i], isDefault: true } });
        }
    }

    // User permissions for admin
    await prisma.userPermission.create({ data: { userId: adminUserId, permissionId: permIds[0], grantedBy: 'system' } });

    // Support Tickets
    const ticketStatuses: Array<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'> = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    for (let i = 0; i < 8; i++) {
        const st = await prisma.supportTicket.create({
            data: { schoolId, ticketNumber: `TKT-2024-${String(i + 1).padStart(4, '0')}`, title: faker.helpers.arrayElement(['Login issue', 'Report card error', 'Fee payment stuck', 'App crashing', 'Cannot view attendance', 'Slow loading', 'Missing data', 'Permission denied']), description: faker.lorem.paragraph(), status: ticketStatuses[i % 4], priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const), createdBy: i < 4 ? adminUserId : teacherUserIds[i - 4], assignedTo: i % 2 === 0 ? adminUserId : undefined, resolvedAt: i % 4 === 2 ? faker.date.recent({ days: 7 }) : undefined },
        });
        await prisma.ticketComment.create({
            data: { ticketId: st.id, authorId: adminUserId, content: faker.lorem.sentence(), isInternal: i % 2 === 0 },
        });
    }

    // Knowledge Base Articles
    const kbCats = ['Getting Started', 'Fee Management', 'Attendance', 'Reports', 'Troubleshooting'];
    for (let i = 0; i < 10; i++) {
        await prisma.knowledgeBaseArticle.create({
            data: { title: faker.lorem.words({ min: 4, max: 8 }), content: faker.lorem.paragraphs(3), category: kbCats[i % 5], tags: [kbCats[i % 5].toLowerCase().replace(/ /g, '-'), 'help'], isPublished: true, authorId: adminUserId, viewCount: faker.number.int({ min: 10, max: 500 }) },
        });
    }
}
