/**
 * Migration script to add missing UserSchool records for existing users
 * 
 * This script fixes users created before the UserSchool relationship was added
 * to the createStudent/createTeacher/createParent/createAdministrator functions.
 * 
 * Run with: npx tsx src/scripts/fix-missing-userschool-records.ts
 */

import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

async function fixMissingUserSchoolRecords() {
    console.log('Starting migration to fix missing UserSchool records...\n');

    try {
        // Find all students without UserSchool records
        const studentsWithoutUserSchool = await db.student.findMany({
            where: {
                user: {
                    userSchools: {
                        none: {}
                    }
                }
            },
            include: {
                user: true
            }
        });

        console.log(`Found ${studentsWithoutUserSchool.length} students without UserSchool records`);

        // Create UserSchool records for students
        for (const student of studentsWithoutUserSchool) {
            await db.userSchool.create({
                data: {
                    userId: student.userId,
                    schoolId: student.schoolId,
                    role: UserRole.STUDENT,
                    isActive: true,
                }
            });
            console.log(`✓ Created UserSchool for student ${student.user.name} (${student.user.mobile})`);
        }

        // Find all teachers without UserSchool records
        const teachersWithoutUserSchool = await db.teacher.findMany({
            where: {
                user: {
                    userSchools: {
                        none: {}
                    }
                }
            },
            include: {
                user: true
            }
        });

        console.log(`\nFound ${teachersWithoutUserSchool.length} teachers without UserSchool records`);

        // Create UserSchool records for teachers
        for (const teacher of teachersWithoutUserSchool) {
            await db.userSchool.create({
                data: {
                    userId: teacher.userId,
                    schoolId: teacher.schoolId,
                    role: UserRole.TEACHER,
                    isActive: true,
                }
            });
            console.log(`✓ Created UserSchool for teacher ${teacher.user.name} (${teacher.user.mobile})`);
        }

        // Find all parents without UserSchool records
        const parentsWithoutUserSchool = await db.parent.findMany({
            where: {
                user: {
                    userSchools: {
                        none: {}
                    }
                }
            },
            include: {
                user: true
            }
        });

        console.log(`\nFound ${parentsWithoutUserSchool.length} parents without UserSchool records`);

        // Create UserSchool records for parents
        for (const parent of parentsWithoutUserSchool) {
            await db.userSchool.create({
                data: {
                    userId: parent.userId,
                    schoolId: parent.schoolId,
                    role: UserRole.PARENT,
                    isActive: true,
                }
            });
            console.log(`✓ Created UserSchool for parent ${parent.user.name} (${parent.user.mobile})`);
        }

        // Find all administrators without UserSchool records
        const adminsWithoutUserSchool = await db.administrator.findMany({
            where: {
                user: {
                    userSchools: {
                        none: {}
                    }
                }
            },
            include: {
                user: true
            }
        });

        console.log(`\nFound ${adminsWithoutUserSchool.length} administrators without UserSchool records`);

        // Create UserSchool records for administrators
        for (const admin of adminsWithoutUserSchool) {
            await db.userSchool.create({
                data: {
                    userId: admin.userId,
                    schoolId: admin.schoolId,
                    role: UserRole.ADMIN,
                    isActive: true,
                }
            });
            console.log(`✓ Created UserSchool for admin ${admin.user.name} (${admin.user.mobile || admin.user.email})`);
        }

        const totalFixed = studentsWithoutUserSchool.length + teachersWithoutUserSchool.length +
            parentsWithoutUserSchool.length + adminsWithoutUserSchool.length;

        console.log(`\n✅ Migration completed! Fixed ${totalFixed} user records.`);
        console.log('\nAll users should now be able to login successfully.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await db.$disconnect();
    }
}

// Run the migration
fixMissingUserSchoolRecords()
    .then(() => {
        console.log('\n🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
