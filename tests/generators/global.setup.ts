import { truncateDatabase } from './clean-db';
import { setupCore } from './setup-core';
import { setupUsers } from './setup-users';

export default async function globalSetup() {
    console.log('🚀 Starting Global Test Setup...');

    if (process.env.NODE_ENV === 'production') {
        throw new Error('Never run test setup in production!');
    }

    if (process.env.PLAYWRIGHT_TEST_DB !== 'true') {
        console.warn('⚠️ WARNING: Skipping DB truncation and seed because PLAYWRIGHT_TEST_DB is not set to true.');
        console.warn('⚠️ Set PLAYWRIGHT_TEST_DB=true in your environment to run the global test setup.');
        return;
    }

    // 1. Wipe the DB clean
    await truncateDatabase();

    // 2. Setup Super Admin, School, and School Admin
    const coreData = await setupCore();

    // 3. Setup dependent test users for the new school
    await setupUsers(coreData.school.id, coreData.academicYear.id);

    console.log('✅ Global Test Setup Complete!');
}
