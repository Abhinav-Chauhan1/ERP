import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

faker.seed(42); // Deterministic data

export const prisma = new PrismaClient();
export { faker };

export type SeedContext = {
    schoolId: string;
    adminUserId: string;
    adminId: string;
    superAdminUserId: string;
    teacherUserIds: string[];
    teacherIds: string[];
    studentUserIds: string[];
    studentIds: string[];
    parentUserIds: string[];
    parentIds: string[];
    academicYearId: string;
    term1Id: string;
    term2Id: string;
    departmentIds: string[];
    classIds: string[];
    sectionIds: string[];
    subjectIds: string[];
    subjectTeacherIds: string[];
    classRoomIds: string[];
    examTypeIds: string[];
    examIds: string[];
    assignmentIds: string[];
    feeStructureId: string;
    feeTypeIds: string[];
    syllabusId: string;
    syllabusUnitIds: string[];
    moduleIds: string[];
    subModuleIds: string[];
    eventIds: string[];
    courseIds: string[];
    courseModuleIds: string[];
    courseLessonIds: string[];
    hostelIds: string[];
    hostelRoomIds: string[];
    allocationIds: string[];
    bookIds: string[];
    routeIds: string[];
    studentRouteIds: string[];
    questionBankIds: string[];
    onlineExamIds: string[];
    calendarCategoryIds: string[];
    calendarEventIds: string[];
    certTemplateIds: string[];
    timetableId: string;
    enrollmentIds: string[];
};

export function log(emoji: string, msg: string) {
    console.log(`${emoji} ${msg}`);
}
