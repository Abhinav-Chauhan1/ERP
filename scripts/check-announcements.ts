
import { db } from "@/lib/db";

async function main() {
    console.log("Checking Announcements...");
    try {
        const announcements = await db.announcement.findMany({
            select: {
                id: true,
                title: true,
                targetAudience: true,
                isActive: true,
            }
        });

        console.log(`Found ${announcements.length} announcements:`);
        announcements.forEach(a => {
            console.log(`- [${a.isActive ? 'ACTIVE' : 'INACTIVE'}] ${a.title}`);
            console.log(`  Target Audience: ${JSON.stringify(a.targetAudience)}`);
        });

    } catch (error) {
        console.error("Error fetching announcements:", error);
    }
}

main();
