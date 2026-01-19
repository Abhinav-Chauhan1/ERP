
import { db } from "@/lib/db";

async function main() {
    console.log("Debugging Teacher Announcement Query...");

    const where: any = {
        targetAudience: {
            has: "TEACHER"
        }
    };

    console.log("Query 'where':", JSON.stringify(where));

    try {
        const count = await db.announcement.count({ where });
        console.log(`Count: ${count}`);

        const announcements = await db.announcement.findMany({
            where,
            select: {
                id: true,
                title: true,
                targetAudience: true,
                isActive: true,
                startDate: true,
                endDate: true,
            },
            orderBy: {
                startDate: "desc"
            },
            take: 50
        });

        console.log(`Found ${announcements.length} announcements:`);
        announcements.forEach(a => {
            console.log(`- [${a.isActive}] ${a.title} (Audience: ${JSON.stringify(a.targetAudience)})`);
        });

    } catch (error) {
        console.error("Error executing query:", error);
    }
}

main();
