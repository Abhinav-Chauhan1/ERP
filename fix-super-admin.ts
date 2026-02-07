// Fix super-admin password - move from 'password' field to 'passwordHash'
import { db } from './src/lib/db';
import bcrypt from 'bcryptjs';

async function fixSuperAdminPassword() {
    try {
        // Find all SUPER_ADMIN users
        const superAdmins = await db.user.findMany({
            where: { role: 'SUPER_ADMIN' },
            select: {
                id: true,
                email: true,
                mobile: true,
                password: true,
                passwordHash: true,
                emailVerified: true,
                role: true
            }
        });

        console.log(`\n📊 Found ${superAdmins.length} SUPER_ADMIN user(s)\n`);

        if (superAdmins.length === 0) {
            console.log('❌ No SUPER_ADMIN users found in database');
            process.exit(1);
        }

        for (const admin of superAdmins) {
            console.log('👤 Processing:', admin.email || admin.mobile);
            console.log('   Current state:', {
                hasPassword: !!admin.password,
                hasPasswordHash: !!admin.passwordHash,
                emailVerified: !!admin.emailVerified
            });

            // Check if password is in wrong field and needs migration
            if (admin.password && !admin.passwordHash) {
                console.log('   ⚠️  Password is in WRONG field (password → passwordHash)');

                // The password in 'password' field is likely plaintext or already hashed
                // We need to check if it's hashed (starts with $2a$ or $2b$)
                const isAlreadyHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');

                const passwordHashToUse = isAlreadyHashed
                    ? admin.password
                    : await bcrypt.hash(admin.password, 12);

                console.log('   🔄 Migrating password...', isAlreadyHashed ? '(already hashed)' : '(hashing now)');

                await db.user.update({
                    where: { id: admin.id },
                    data: {
                        passwordHash: passwordHashToUse,
                        password: null, // Clear the wrong field
                        emailVerified: admin.emailVerified || new Date() // Verify email if not already
                    }
                });

                console.log('   ✅ Password migrated successfully!');
            } else if (admin.passwordHash) {
                console.log('   ✅ Password already in correct field');

                // Just verify email if needed
                if (!admin.emailVerified) {
                    await db.user.update({
                        where: { id: admin.id },
                        data: { emailVerified: new Date() }
                    });
                    console.log('   ✅ Email verified');
                }
            } else {
                console.log('   ⚠️  No password found in either field!');
            }

            console.log('');
        }

        console.log('🎉 All SUPER_ADMIN accounts processed!\n');
        console.log('🔓 You can now login with your SUPER_ADMIN credentials\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixSuperAdminPassword();
