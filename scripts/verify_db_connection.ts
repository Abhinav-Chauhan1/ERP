
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    console.log('Connecting to database...');
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        console.log('Running query...');
        const count = await db.announcement.count({
            where: {
                isActive: true,
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
        });
        console.log('Query successful. Count:', count);
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

main();
