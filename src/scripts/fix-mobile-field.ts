/**
 * Migration script to fix mobile numbers for existing users
 * 
 * This script copies phone numbers from the legacy 'phone' field to the 'mobile' field
 * which is required for authentication.
 * 
 * Run with: npx tsx src/scripts/fix-mobile-field.ts
 */

import { db } from '@/lib/db';

async function fixMobileField() {
    console.log('Starting migration to fix mobile field...\n');

    try {
        // Find all users where phone is set but mobile is null
        const usersWithPhoneOnly = await db.user.findMany({
            where: {
                mobile: null,
                phone: {
                    not: null
                }
            }
        });

        console.log(`Found ${usersWithPhoneOnly.length} users with phone but no mobile`);

        // Update each user to copy phone to mobile
        for (const user of usersWithPhoneOnly) {
            await db.user.update({
                where: { id: user.id },
                data: {
                    mobile: user.phone
                }
            });
            console.log(`✓ Updated ${user.name} - mobile set to ${user.phone}`);
        }

        console.log(`\n✅ Migration completed! Fixed ${usersWithPhoneOnly.length} user records.`);
        console.log('\nAll users should now be able to login with their mobile numbers.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await db.$disconnect();
    }
}

// Run the migration
fixMobileField()
    .then(() => {
        console.log('\n🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
