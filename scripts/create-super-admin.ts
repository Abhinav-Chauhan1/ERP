import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'superadmin@example.com';
    const password = 'SuperAdmin123!';
    const hashedPassword = await hash(password, 12);

    console.log(`Checking for existing super admin...`);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log(`User ${email} already exists.`);

        // Update user to ensure password and role are set correctly
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
                role: UserRole.SUPER_ADMIN, // Set role directly on User model
                isActive: true,
            },
        });

        console.log(`Updated user ${email} with SUPER_ADMIN role and password: ${password}`);
    } else {
        // Create new user with SUPER_ADMIN role
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name: 'Super Admin',
                firstName: 'Super',
                lastName: 'Admin',
                role: UserRole.SUPER_ADMIN, // Set role directly on User model
                isActive: true,
            },
        });

        console.log(`Created new user ${email} with role SUPER_ADMIN`);
        console.log(`Password: ${password}`);
    }

    // Create audit log entry
    await prisma.auditLog.create({
        data: {
            action: 'CREATE_SUPER_ADMIN',
            resource: 'USER',
            changes: {
                email,
                action: 'super_admin_created_or_updated',
                timestamp: new Date(),
            },
            checksum: `create-super-admin-${Date.now()}`,
        },
    });

    console.log(`\n✅ Super Admin Setup Complete!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌐 Login URL: /sd (Super Admin login route)`);
    console.log(`\nYou can now login at /sd with these credentials.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
