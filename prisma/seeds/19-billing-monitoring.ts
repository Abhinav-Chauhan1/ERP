import { prisma, faker, log } from './helpers';

export async function seedBillingAndSubscriptions(schoolId: string) {
    log('💳', 'Creating billing and subscriptions...');
    // Subscription Plans
    const plans = [
        { name: 'Starter Plan', code: 'STARTER', type: 'STARTER' as const, price: 4999, maxStudents: 200, features: ['Basic Attendance', 'Fee Management', 'Report Cards'] },
        { name: 'Growth Plan', code: 'GROWTH', type: 'GROWTH' as const, price: 9999, maxStudents: 1000, features: ['All Starter Features', 'Online Exams', 'Library', 'Transport'] },
        { name: 'Dominate Plan', code: 'DOMINATE', type: 'DOMINATE' as const, price: 19999, maxStudents: 5000, features: ['All Growth Features', 'Hostel', 'Alumni', 'Certificates', 'Priority Support'] },
    ];
    const createdPlans = [];
    for (const p of plans) {
        const created = await prisma.subscriptionPlan.create({
            data: { name: p.name, amount: p.price, interval: 'yearly', features: p.features, isActive: true },
        });
        createdPlans.push(created);
    }

    // Enhanced Subscription
    const enhancedSub = await prisma.enhancedSubscription.create({
        data: { schoolId, planId: createdPlans[2].id, status: 'ACTIVE', currentPeriodStart: new Date('2024-04-01'), currentPeriodEnd: new Date('2025-03-31') },
    });

    // Invoices
    for (let i = 0; i < 3; i++) {
        await prisma.invoice.create({
            data: { subscriptionId: enhancedSub.id, amount: 19999, status: i < 2 ? 'PAID' : 'OPEN', dueDate: new Date(`2024-${String((i + 1) * 3 + 1).padStart(2, '0')}-15`) },
        });
    }

    // Payments
    for (let i = 0; i < 2; i++) {
        await prisma.payment.create({
            data: { subscriptionId: enhancedSub.id, amount: 19999, status: 'COMPLETED' },
        });
    }

    // Payment Method Record
    await prisma.paymentMethodRecord.create({
        data: { schoolId, type: 'BANK_TRANSFER', encryptedDetails: '***' },
    });

    // Usage Counter
    await prisma.usageCounter.create({
        data: { schoolId, month: '2024-04' },
    });
}

export async function seedMonitoringAndSecurity(schoolId: string, adminUserId: string) {
    log('📊', 'Creating monitoring and security data...');
    // Audit Logs
    const actions: Array<'CREATE' | 'UPDATE' | 'LOGIN' | 'EXPORT'> = ['CREATE', 'UPDATE', 'LOGIN', 'EXPORT'];
    for (let i = 0; i < 15; i++) {
        await prisma.auditLog.create({
            data: { userId: adminUserId, schoolId, action: actions[i % 4], details: JSON.stringify({ resource: faker.helpers.arrayElement(['Student', 'Fee', 'Exam', 'Attendance']), description: faker.lorem.sentence() }), ipAddress: '192.168.1.' + faker.number.int({ min: 1, max: 254 }), userAgent: 'Mozilla/5.0 Chrome/120' },
        });
    }

    // Compliance Report
    await prisma.complianceReport.create({
        data: { reportType: 'GDPR_AUDIT', timeRange: JSON.stringify({ from: '2024-01-01', to: '2024-06-30' }), generatedBy: adminUserId, status: 'COMPLETED', reportData: JSON.stringify({ totalUsers: 41, dataAccessed: 120, anomalies: 0 }) },
    });

    // Analytics Events
    for (let i = 0; i < 10; i++) {
        await prisma.analyticsEvent.create({
            data: { eventType: faker.helpers.arrayElement(['page_view', 'login', 'report_generated', 'fee_payment', 'attendance_marked']), schoolId, userId: adminUserId, properties: JSON.stringify({ page: faker.internet.url(), duration: faker.number.int({ min: 1, max: 300 }) }) },
        });
    }

    // Backup
    for (let i = 0; i < 3; i++) {
        await prisma.backup.create({
            data: { schoolId, filename: `backup_2024_0${i + 4}.sql.gz`, size: BigInt(faker.number.int({ min: 50000000, max: 500000000 })), location: `/backups/backup_2024_0${i + 4}.sql.gz`, encrypted: true, type: i === 0 ? 'MANUAL' : 'SCHEDULED', status: 'COMPLETED', completedAt: new Date(`2024-0${i + 4}-30`) },
        });
    }

    // System Metrics
    for (let i = 0; i < 10; i++) {
        await prisma.systemMetric.create({ data: { metricName: faker.helpers.arrayElement(['cpu_usage', 'memory_usage', 'disk_usage', 'request_count']), value: faker.number.float({ min: 10, max: 90, fractionDigits: 1 }), unit: '%', schoolId } });
    }

    // Alerts
    for (let i = 0; i < 5; i++) {
        await prisma.alert.create({
            data: { alertType: faker.helpers.arrayElement(['high_error_rate', 'usage_threshold', 'disk_space']), severity: faker.helpers.arrayElement(['INFO', 'WARNING', 'ERROR']), title: faker.lorem.words(4), description: faker.lorem.sentence(), isResolved: i < 3, resolvedAt: i < 3 ? faker.date.recent({ days: 5 }) : undefined, resolvedBy: i < 3 ? adminUserId : undefined, schoolId },
        });
    }

    // Alert Configs
    await prisma.alertConfig.create({
        data: { name: 'High Error Rate', alertType: 'error_rate', threshold: 5, condition: 'greater', enabled: true, notifyAdmins: true, schoolId, createdBy: adminUserId },
    });
    await prisma.alertConfig.create({
        data: { name: 'Disk Space Low', alertType: 'usage_threshold', threshold: 90, condition: 'greater', enabled: true, notifyEmail: true, emailRecipients: ['admin@dpsvk.edu.in'], schoolId, createdBy: adminUserId },
    });

    // System Health
    for (const comp of ['api', 'database', 'cache', 'email_service', 'sms_service']) {
        await prisma.systemHealth.create({
            data: { component: comp, status: comp === 'sms_service' ? 'DEGRADED' : 'HEALTHY', responseTime: faker.number.float({ min: 5, max: 200, fractionDigits: 1 }), errorRate: faker.number.float({ min: 0, max: 2, fractionDigits: 2 }) },
        });
    }

    // Performance Metrics
    for (let i = 0; i < 10; i++) {
        await prisma.performanceMetric.create({
            data: { metricType: faker.helpers.arrayElement(['cpu_usage', 'memory_usage', 'response_time', 'throughput']), value: faker.number.float({ min: 10, max: 90, fractionDigits: 1 }), unit: faker.helpers.arrayElement(['%', 'ms', 'req/s']), component: faker.helpers.arrayElement(['api', 'database', 'cache']) },
        });
    }

    // Security: Blocked identifiers, Login failures, Rate limit logs
    await prisma.blockedIdentifier.create({ data: { identifier: '+91-9999999999', reason: 'Too many OTP requests', attempts: 5, isActive: true, expiresAt: faker.date.soon({ days: 1 }) } });
    await prisma.blockedIdentifier.create({ data: { identifier: 'spammer@test.com', reason: 'Suspicious activity', attempts: 10, isActive: true, expiresAt: faker.date.soon({ days: 7 }) } });

    for (let i = 0; i < 5; i++) {
        await prisma.loginFailure.create({ data: { identifier: `user${i}@test.com`, reason: 'Invalid password', ipAddress: `192.168.1.${100 + i}`, userAgent: 'Mozilla/5.0' } });
    }

    for (let i = 0; i < 3; i++) {
        await prisma.rateLimitLog.create({ data: { identifier: `+91-987654321${i}`, action: 'RATE_LIMIT_HIT', type: 'OTP_GENERATION', details: JSON.stringify({ attempts: 5 + i }) } });
    }

    // Emergency Access
    await prisma.emergencyAccess.create({
        data: { targetType: 'USER', targetId: 'test-user-id', targetName: 'Test User', action: 'DISABLE', reason: 'Security audit', performedBy: adminUserId, affectedUsers: 1, invalidatedSessions: 2, isReversed: true, reversedAt: faker.date.recent({ days: 2 }), reversedBy: adminUserId, reversedReason: 'Audit completed' },
    });
}
