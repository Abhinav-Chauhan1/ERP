
import { db } from "@/lib/db";

async function main() {
    try {
        console.log("Checking Classes...");
        const classes = await db.class.findMany({
            include: {
                enrollments: true
            }
        });
        console.log(`Found ${classes.length} classes.`);
        classes.forEach(c => {
            console.log(`Class: ${c.name} (ID: ${c.id})`);
            console.log(`  Total Enrollments: ${c.enrollments.length}`);
            const activeEnrollments = c.enrollments.filter(e => e.status === 'ACTIVE');
            console.log(`  Active Enrollments: ${activeEnrollments.length}`);
            if (c.enrollments.length > 0) {
                console.log(`  First Enrollment Status: ${c.enrollments[0].status}`);
            }
        });

        console.log("\nChecking Enrollments directly...");
        const enrollments = await db.classEnrollment.findMany();
        console.log(`Total Enrollments in DB: ${enrollments.length}`);
        if (enrollments.length > 0) {
            console.log("Sample Enrollment:", enrollments[0]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

main();
