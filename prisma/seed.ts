import { prisma, log } from './seeds/helpers';
import { seedSchool } from './seeds/00-school';
import { seedUsers } from './seeds/01-users';
import { seedAcademics } from './seeds/02-academics';
import { seedSubjects } from './seeds/03-subjects';
import { seedEnrollment } from './seeds/04-enrollment';
import { seedSyllabus } from './seeds/05-syllabus';
import { seedTimetable } from './seeds/06-timetable';
import { seedExams } from './seeds/07-exams';
import { seedAssignments, seedAttendance } from './seeds/08-assignments-attendance';
import { seedReportCards } from './seeds/09-report-cards';
import { seedFinance } from './seeds/10-finance';
import { seedLibrary, seedTransport } from './seeds/11-library-transport';
import { seedHostel } from './seeds/12-hostel';
import { seedOnlineLearning } from './seeds/13-online-learning';
import { seedQuestionBank, seedCommunication } from './seeds/14-questionbank-communication';
import { seedCalendarAndEvents } from './seeds/15-calendar-events';
import { seedDocumentsAndCerts, seedLeaveAndMeetings } from './seeds/16-documents-leave';
import { seedAdmissions, seedAlumni } from './seeds/17-admissions-alumni';
import { seedSupportAndPermissions } from './seeds/18-support-permissions';
import { seedBillingAndSubscriptions, seedMonitoringAndSecurity } from './seeds/19-billing-monitoring';
import { seedGamification, seedReports } from './seeds/20-gamification-reports';

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');
  console.log('═'.repeat(60));

  // Phase 1: Foundation
  log('📦', 'PHASE 1: Foundation');
  const { schoolId } = await seedSchool();
  const users = await seedUsers(schoolId);
  const academics = await seedAcademics(schoolId);

  // Phase 2: Academic Structure
  log('📦', 'PHASE 2: Academic Structure');
  const { subjectIds, subjectTeacherIds } = await seedSubjects(schoolId, academics.departmentIds, academics.classIds, academics.sectionIds, users.teacherIds);
  const { enrollmentIds } = await seedEnrollment(schoolId, academics.classIds, academics.sectionIds, users.studentIds, users.teacherIds);
  const syllabus = await seedSyllabus(schoolId, subjectIds, users.adminUserId);
  const { timetableId } = await seedTimetable(schoolId, academics.classIds, academics.sectionIds, subjectTeacherIds, academics.classRoomIds);

  // Phase 3: Assessments
  log('📦', 'PHASE 3: Assessments');
  const { examTypeIds, examIds } = await seedExams(schoolId, subjectIds, users.teacherIds, users.studentIds, academics.term1Id, academics.term2Id, academics.classIds);
  const { assignmentIds } = await seedAssignments(schoolId, subjectIds, users.teacherIds, academics.classIds, users.studentIds);
  await seedAttendance(schoolId, users.studentIds, academics.sectionIds, users.teacherIds, users.teacherUserIds, users.adminUserId);
  await seedReportCards(schoolId, users.studentIds, academics.term1Id, examIds, subjectIds, users.adminUserId);

  // Phase 4: Finance
  log('📦', 'PHASE 4: Finance');
  await seedFinance(schoolId, academics.academicYearId, users.studentIds, academics.classIds, users.teacherIds);

  // Phase 5: Extended Modules
  log('📦', 'PHASE 5: Extended Modules');
  await seedLibrary(schoolId, users.studentIds);
  await seedTransport(schoolId, users.studentIds);
  await seedHostel(schoolId, users.studentIds);
  await seedOnlineLearning(schoolId, users.teacherIds, subjectIds, academics.classIds, users.studentIds);
  const { questionBankIds, onlineExamIds } = await seedQuestionBank(schoolId, subjectIds, users.teacherIds, academics.classIds, users.studentIds);

  // Phase 6: Communication & Events
  log('📦', 'PHASE 6: Communication & Events');
  await seedCommunication(schoolId, users.adminUserId, users.adminId, users.teacherUserIds, users.studentUserIds, users.parentUserIds);
  await seedCalendarAndEvents(schoolId, users.adminUserId, users.studentUserIds, users.teacherUserIds);

  // Phase 7: Documents & Admin
  log('📦', 'PHASE 7: Documents & Admin');
  await seedDocumentsAndCerts(schoolId, users.adminUserId, users.teacherUserIds, users.studentUserIds, users.studentIds);
  await seedLeaveAndMeetings(schoolId, users.teacherUserIds, users.teacherIds, users.parentIds);
  await seedAdmissions(schoolId, academics.classIds);
  await seedAlumni(schoolId, users.studentIds, enrollmentIds, users.adminUserId);

  // Phase 8: System
  log('📦', 'PHASE 8: System');
  await seedSupportAndPermissions(schoolId, users.adminUserId, users.teacherUserIds);
  await seedBillingAndSubscriptions(schoolId);
  await seedMonitoringAndSecurity(schoolId, users.adminUserId);
  await seedGamification(schoolId, users.studentIds);
  await seedReports(schoolId, users.adminUserId);

  // Teacher Achievements (legacy model)
  const achCats: Array<'AWARD' | 'CERTIFICATION' | 'PROFESSIONAL_DEVELOPMENT' | 'PUBLICATION' | 'RECOGNITION'> = ['AWARD', 'CERTIFICATION', 'PROFESSIONAL_DEVELOPMENT', 'PUBLICATION', 'RECOGNITION'];
  for (let i = 0; i < 5; i++) {
    await prisma.achievement.create({
      data: { schoolId, title: `Teacher Achievement ${i + 1}`, description: `Recognition for excellence`, category: achCats[i], date: new Date(`2024-0${i + 3}-15`), teacherId: users.teacherIds[i], documents: [] },
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ DATABASE SEED COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log('───────────────────────────────────────');
  console.log(`   🏫 School: 1 (DPS Vasant Kunj)`);
  console.log(`   👤 Users: 41 (1 admin + 10 teachers + 20 students + 10 parents)`);
  console.log(`   📅 Academic: 1 year, 2 terms, 8 departments`);
  console.log(`   🏫 Classes: 4 classes, 8 sections, 12 classrooms`);
  console.log(`   📚 Subjects: 10 subjects, variants, groups`);
  console.log(`   📝 Enrollment: 20 enrollments, 4 class teachers`);
  console.log(`   📖 Syllabus: 5 syllabi, modules, submodules, lessons`);
  console.log(`   🕐 Timetable: 1 config, 8 periods, 60 slots`);
  console.log(`   📋 Exams: 4 types, 10 exams, 30 results, 9 grade scales`);
  console.log(`   📄 Assignments: 18 assignments, 50 submissions`);
  console.log(`   ✅ Attendance: 100 student, 50 teacher records`);
  console.log(`   📊 Report Cards: 15 cards, 4 co-scholastic activities`);
  console.log(`   💰 Finance: fee types, structure, 15 payments, budgets, expenses, payroll`);
  console.log(`   📚 Library: 20 books, 10 issues, 5 reservations`);
  console.log(`   🚌 Transport: 3 vehicles, 3 routes, 6 student routes`);
  console.log(`   🏠 Hostel: 2 hostels, 20 rooms, 8 allocations`);
  console.log(`   🎓 Online Learning: 3 courses, 15 enrollments, quizzes`);
  console.log(`   ❓ Question Bank: 25 questions, 3 online exams`);
  console.log(`   💬 Communication: messages, announcements, templates, logs`);
  console.log(`   📅 Calendar: 6 categories, 10 events, reminders`);
  console.log(`   📄 Documents: 6 types, 10 docs, 6 cert templates`);
  console.log(`   🎓 Admissions: 10 applications, merit list`);
  console.log(`   🎓 Alumni: 3 alumni, promotion history`);
  console.log(`   🔐 Permissions: 40 permissions, role assignments`);
  console.log(`   🎫 Support: 8 tickets, 10 KB articles`);
  console.log(`   💳 Billing: 3 plans, subscriptions, invoices`);
  console.log(`   📊 Monitoring: audit logs, metrics, alerts, backups`);
  console.log(`   🔒 Security: blocked IDs, login failures, rate limits`);
  console.log(`   🎮 Gamification: achievements, XP, notes, flashcards, mind maps`);
  console.log(`   📊 Reports: 5 saved configs, 3 scheduled reports`);
  console.log('───────────────────────────────────────');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
