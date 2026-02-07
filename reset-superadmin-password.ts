import { db } from './src/lib/db';
import bcrypt from 'bcryptjs';

async function resetSuperAdminPassword() {
    const newPassword = 'Admin@123';

    console.log('🔐 Resetting super-admin password...\n');

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the super-admin user
    const result = await db.user.updateMany({
        where: { role: 'SUPER_ADMIN' },
        data: {
            passwordHash,
            password: null,
            emailVerified: new Date()
        }
    });

    console.log(`✅ Reset password for ${result.count} SUPER_ADMIN user(s)\n`);
    console.log('📧 Email: superadmin@example.com');
    console.log('🔑 New Password: ' + newPassword);
    console.log('\n🔓 You can now login at: http://localhost:3000/super-admin/login\n');

    process.exit(0);
}

resetSuperAdminPassword().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
