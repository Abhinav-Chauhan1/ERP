import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function truncateDatabase() {
    console.log('🧹 Truncating database...');

    if (process.env.NODE_ENV === 'production') {
        throw new Error('Never run truncateDatabase in production!');
    }

    try {
        // Disable foreign key checks for the transaction
        await prisma.$executeRawUnsafe(`SET CONSTRAINTS ALL DEFERRED;`);

        // Get all table names
        const tables = await prisma.$queryRaw<
            Array<{ tablename: string }>
        >`SELECT tablename FROM pg_tables WHERE schemaname='public';`;

        console.log(`Found ${tables.length} tables to truncate.`);

        // Truncate all tables except migrations
        for (const { tablename } of tables) {
            if (tablename !== '_prisma_migrations') {
                try {
                    await prisma.$executeRawUnsafe(
                        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
                    );
                } catch (error) {
                    console.error(`Error truncating table ${tablename}:`, error);
                }
            }
        }

        console.log('✅ Database truncated successfully.');
    } catch (error) {
        console.error('❌ Error truncating database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    truncateDatabase()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
