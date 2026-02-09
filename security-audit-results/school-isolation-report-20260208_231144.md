# School Isolation Audit Report
Generated: Sun Feb  8 11:11:44 PM IST 2026

## FindMany Queries Without SchoolId

No issues found

---

## FindFirst Queries Without SchoolId

No issues found

---

## Update/Delete Operations

No issues found

---

## Count Operations

No issues found

---

## Aggregate Operations

No issues found

---

## API Route Handlers

No issues found

---

## Server Actions

src/lib/actions/teacherLessonsActions.ts-20- * Get all lessons taught by the teacher
src/lib/actions/teacherLessonsActions.ts-21- */
src/lib/actions/teacherLessonsActions.ts:22:export async function getTeacherLessons(subjectId?: string) {
src/lib/actions/teacherLessonsActions.ts-23-  try {
src/lib/actions/teacherLessonsActions.ts-24-    const session = await auth();
src/lib/actions/teacherLessonsActions.ts-25-    const userId = session?.user?.id;
src/lib/actions/teacherLessonsActions.ts-26-    
src/lib/actions/teacherLessonsActions.ts-27-    if (!userId) {
--
src/lib/actions/teacherLessonsActions.ts-99- * Get a specific lesson by ID
src/lib/actions/teacherLessonsActions.ts-100- */
src/lib/actions/teacherLessonsActions.ts:101:export async function getTeacherLesson(lessonId: string) {
src/lib/actions/teacherLessonsActions.ts-102-  try {
src/lib/actions/teacherLessonsActions.ts-103-    const session = await auth();
src/lib/actions/teacherLessonsActions.ts-104-    const userId = session?.user?.id;
src/lib/actions/teacherLessonsActions.ts-105-    
src/lib/actions/teacherLessonsActions.ts-106-    if (!userId) {
--
src/lib/actions/teacherLessonsActions.ts-193- * Create a new lesson
src/lib/actions/teacherLessonsActions.ts-194- */
src/lib/actions/teacherLessonsActions.ts:195:export async function createLesson(formData: FormData) {
src/lib/actions/teacherLessonsActions.ts-196-  try {
src/lib/actions/teacherLessonsActions.ts-197-    const session = await auth();
src/lib/actions/teacherLessonsActions.ts-198-    const userId = session?.user?.id;
src/lib/actions/teacherLessonsActions.ts-199-    
src/lib/actions/teacherLessonsActions.ts-200-    if (!userId) {
--
src/lib/actions/teacherLessonsActions.ts-272- * Update an existing lesson
src/lib/actions/teacherLessonsActions.ts-273- */
src/lib/actions/teacherLessonsActions.ts:274:export async function updateLesson(lessonId: string, formData: FormData) {
src/lib/actions/teacherLessonsActions.ts-275-  try {
src/lib/actions/teacherLessonsActions.ts-276-    const session = await auth();
src/lib/actions/teacherLessonsActions.ts-277-    const userId = session?.user?.id;
src/lib/actions/teacherLessonsActions.ts-278-    
src/lib/actions/teacherLessonsActions.ts-279-    if (!userId) {
--
src/lib/actions/teacherLessonsActions.ts-361- * Delete a lesson
src/lib/actions/teacherLessonsActions.ts-362- */
src/lib/actions/teacherLessonsActions.ts:363:export async function deleteLesson(lessonId: string) {
src/lib/actions/teacherLessonsActions.ts-364-  try {
src/lib/actions/teacherLessonsActions.ts-365-    const session = await auth();
src/lib/actions/teacherLessonsActions.ts-366-    const userId = session?.user?.id;
src/lib/actions/teacherLessonsActions.ts-367-    
src/lib/actions/teacherLessonsActions.ts-368-    if (!userId) {
--
src/lib/actions/teacherLessonsActions.ts-424- * Get syllabus units for a subject
src/lib/actions/teacherLessonsActions.ts-425- */
src/lib/actions/teacherLessonsActions.ts:426:export async function getSubjectSyllabusUnits(subjectId: string) {
src/lib/actions/teacherLessonsActions.ts-427-  try {
src/lib/actions/teacherLessonsActions.ts-428-    const session = await auth();
src/lib/actions/teacherLessonsActions.ts-429-    const userId = session?.user?.id;
src/lib/actions/teacherLessonsActions.ts-430-    
src/lib/actions/teacherLessonsActions.ts-431-    if (!userId) {
--
src/lib/actions/rankCalculationActions.ts-23- * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
src/lib/actions/rankCalculationActions.ts-24- */
src/lib/actions/rankCalculationActions.ts:25:export async function calculateClassRanks(
src/lib/actions/rankCalculationActions.ts-26-  classId: string,
src/lib/actions/rankCalculationActions.ts-27-  termId: string
src/lib/actions/rankCalculationActions.ts-28-): Promise<ActionResult> {
src/lib/actions/rankCalculationActions.ts-29-  try {
src/lib/actions/rankCalculationActions.ts-30-    // CRITICAL: Add school isolation
--
src/lib/actions/rankCalculationActions.ts-190- * Get classes and terms for rank calculation dropdown
src/lib/actions/rankCalculationActions.ts-191- */
src/lib/actions/rankCalculationActions.ts:192:export async function getClassesAndTermsForRanks(): Promise<ActionResult> {
src/lib/actions/rankCalculationActions.ts-193-  try {
src/lib/actions/rankCalculationActions.ts-194-    // CRITICAL: Add school isolation
src/lib/actions/rankCalculationActions.ts-195-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/rankCalculationActions.ts-196-    const schoolId = await getRequiredSchoolId();
src/lib/actions/rankCalculationActions.ts-197-
--
src/lib/actions/rankCalculationActions.ts-249- * Get rank statistics for a class and term
src/lib/actions/rankCalculationActions.ts-250- */
src/lib/actions/rankCalculationActions.ts:251:export async function getRankStatistics(
src/lib/actions/rankCalculationActions.ts-252-  classId: string,
src/lib/actions/rankCalculationActions.ts-253-  termId: string
src/lib/actions/rankCalculationActions.ts-254-): Promise<ActionResult> {
src/lib/actions/rankCalculationActions.ts-255-  try {
src/lib/actions/rankCalculationActions.ts-256-    // CRITICAL: Add school isolation
--
src/lib/actions/lessonsActions.ts-7-
src/lib/actions/lessonsActions.ts-8-// Get all lessons with expanded relationships
src/lib/actions/lessonsActions.ts:9:export async function getLessons() {
src/lib/actions/lessonsActions.ts-10-  try {
src/lib/actions/lessonsActions.ts-11-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-12-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/lessonsActions.ts-13-
src/lib/actions/lessonsActions.ts-14-    const lessons = await db.lesson.findMany({
--
src/lib/actions/lessonsActions.ts-76-
src/lib/actions/lessonsActions.ts-77-// Get a single lesson by ID
src/lib/actions/lessonsActions.ts:78:export async function getLessonById(id: string) {
src/lib/actions/lessonsActions.ts-79-  try {
src/lib/actions/lessonsActions.ts-80-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-81-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/lessonsActions.ts-82-
src/lib/actions/lessonsActions.ts-83-    const lesson = await db.lesson.findUnique({
--
src/lib/actions/lessonsActions.ts-137-
src/lib/actions/lessonsActions.ts-138-// Get all subjects for the dropdown
src/lib/actions/lessonsActions.ts:139:export async function getSubjectsForLessons() {
src/lib/actions/lessonsActions.ts-140-  try {
src/lib/actions/lessonsActions.ts-141-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-142-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/lessonsActions.ts-143-
src/lib/actions/lessonsActions.ts-144-    const subjects = await db.subject.findMany({
--
src/lib/actions/lessonsActions.ts-185-
src/lib/actions/lessonsActions.ts-186-// Get syllabus units for a specific subject
src/lib/actions/lessonsActions.ts:187:export async function getSyllabusUnitsBySubject(subjectId: string) {
src/lib/actions/lessonsActions.ts-188-  try {
src/lib/actions/lessonsActions.ts-189-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-190-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/lessonsActions.ts-191-
src/lib/actions/lessonsActions.ts-192-    // Verify subject belongs to school
--
src/lib/actions/lessonsActions.ts-216-
src/lib/actions/lessonsActions.ts-217-// Create a new lesson
src/lib/actions/lessonsActions.ts:218:export async function createLesson(data: LessonFormValues) {
src/lib/actions/lessonsActions.ts-219-  try {
src/lib/actions/lessonsActions.ts-220-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-221-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/lessonsActions.ts-222-
src/lib/actions/lessonsActions.ts-223-    // Check if subject exists and belongs to school
--
src/lib/actions/lessonsActions.ts-275-
src/lib/actions/lessonsActions.ts-276-// Update an existing lesson
src/lib/actions/lessonsActions.ts:277:export async function updateLesson(data: LessonUpdateFormValues) {
src/lib/actions/lessonsActions.ts-278-  try {
src/lib/actions/lessonsActions.ts-279-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-280-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/lessonsActions.ts-281-
src/lib/actions/lessonsActions.ts-282-    // Validate lesson exists
--
src/lib/actions/lessonsActions.ts-345-
src/lib/actions/lessonsActions.ts-346-// Delete a lesson
src/lib/actions/lessonsActions.ts:347:export async function deleteLesson(id: string) {
src/lib/actions/lessonsActions.ts-348-  try {
src/lib/actions/lessonsActions.ts-349-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lessonsActions.ts-350-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/lessonsActions.ts-351-
src/lib/actions/lessonsActions.ts-352-    // Check if lesson exists
--
src/lib/actions/paymentReceiptActions.ts-50- * Security: Rate limiting, input sanitization, file validation
src/lib/actions/paymentReceiptActions.ts-51- */
src/lib/actions/paymentReceiptActions.ts:52:export async function uploadPaymentReceipt(
src/lib/actions/paymentReceiptActions.ts-53-  data: ReceiptUploadFormValues & { receiptImage: File }
src/lib/actions/paymentReceiptActions.ts-54-) {
src/lib/actions/paymentReceiptActions.ts-55-  try {
src/lib/actions/paymentReceiptActions.ts-56-    // Get authenticated user
src/lib/actions/paymentReceiptActions.ts-57-    const session = await auth();
--
src/lib/actions/paymentReceiptActions.ts-276- * Get receipts for a student with optional filters
src/lib/actions/paymentReceiptActions.ts-277- */
src/lib/actions/paymentReceiptActions.ts:278:export async function getStudentReceipts(
src/lib/actions/paymentReceiptActions.ts-279-  studentId: string,
src/lib/actions/paymentReceiptActions.ts-280-  filters?: {
src/lib/actions/paymentReceiptActions.ts-281-    status?: ReceiptStatus;
src/lib/actions/paymentReceiptActions.ts-282-    dateFrom?: Date;
src/lib/actions/paymentReceiptActions.ts-283-    dateTo?: Date;
--
src/lib/actions/paymentReceiptActions.ts-421- * Get a single receipt by ID with authorization check
src/lib/actions/paymentReceiptActions.ts-422- */
src/lib/actions/paymentReceiptActions.ts:423:export async function getReceiptById(receiptId: string) {
src/lib/actions/paymentReceiptActions.ts-424-  try {
src/lib/actions/paymentReceiptActions.ts-425-    // Get authenticated user
src/lib/actions/paymentReceiptActions.ts-426-    const session = await auth();
src/lib/actions/paymentReceiptActions.ts-427-    const userId = session?.user?.id;
src/lib/actions/paymentReceiptActions.ts-428-    if (!userId) {
--
src/lib/actions/paymentReceiptActions.ts-529- * Get a receipt by reference number
src/lib/actions/paymentReceiptActions.ts-530- */
src/lib/actions/paymentReceiptActions.ts:531:export async function getReceiptByReference(referenceNumber: string) {
src/lib/actions/paymentReceiptActions.ts-532-  try {
src/lib/actions/paymentReceiptActions.ts-533-    // Get authenticated user
src/lib/actions/paymentReceiptActions.ts-534-    const session = await auth();
src/lib/actions/paymentReceiptActions.ts-535-    const userId = session?.user?.id;
src/lib/actions/paymentReceiptActions.ts-536-    if (!userId) {
--
src/lib/actions/student-achievements-actions.ts-33- * Get student achievements and stats
src/lib/actions/student-achievements-actions.ts-34- */
src/lib/actions/student-achievements-actions.ts:35:export async function getStudentAchievements(studentId?: string) {
src/lib/actions/student-achievements-actions.ts-36-  try {
src/lib/actions/student-achievements-actions.ts-37-    const session = await auth();
src/lib/actions/student-achievements-actions.ts-38-    if (!session?.user?.id) {
src/lib/actions/student-achievements-actions.ts-39-      throw new Error("Not authenticated");
src/lib/actions/student-achievements-actions.ts-40-    }
--
src/lib/actions/student-achievements-actions.ts-148- * Unlock an achievement for a student
src/lib/actions/student-achievements-actions.ts-149- */
src/lib/actions/student-achievements-actions.ts:150:export async function unlockAchievement(achievementId: string) {
src/lib/actions/student-achievements-actions.ts-151-  try {
src/lib/actions/student-achievements-actions.ts-152-    const session = await auth();
src/lib/actions/student-achievements-actions.ts-153-    if (!session?.user?.id) {
src/lib/actions/student-achievements-actions.ts-154-      throw new Error("Not authenticated");
src/lib/actions/student-achievements-actions.ts-155-    }
--
src/lib/actions/student-achievements-actions.ts-211- * Update achievement progress
src/lib/actions/student-achievements-actions.ts-212- */
src/lib/actions/student-achievements-actions.ts:213:export async function updateAchievementProgress(
src/lib/actions/student-achievements-actions.ts-214-  studentId: string,
src/lib/actions/student-achievements-actions.ts-215-  category: string,
src/lib/actions/student-achievements-actions.ts-216-  increment: number = 1
src/lib/actions/student-achievements-actions.ts-217-) {
src/lib/actions/student-achievements-actions.ts-218-  try {
--
src/lib/actions/student-achievements-actions.ts-257- * Award XP to a student
src/lib/actions/student-achievements-actions.ts-258- */
src/lib/actions/student-achievements-actions.ts:259:export async function awardXP(studentId: string, points: number) {
src/lib/actions/student-achievements-actions.ts-260-  try {
src/lib/actions/student-achievements-actions.ts-261-    const xpLevel = await db.studentXPLevel.findUnique({
src/lib/actions/student-achievements-actions.ts-262-      where: { studentId }
src/lib/actions/student-achievements-actions.ts-263-    });
src/lib/actions/student-achievements-actions.ts-264-
--
src/lib/actions/idCardGenerationActions.ts-40- * Generate ID card for a single student
src/lib/actions/idCardGenerationActions.ts-41- */
src/lib/actions/idCardGenerationActions.ts:42:export async function generateStudentIDCard(studentId: string, academicYear: string, templateId: string = 'STANDARD'): Promise<IDCardGenerationResult | { success: false; error: string }> {
src/lib/actions/idCardGenerationActions.ts-43-  try {
src/lib/actions/idCardGenerationActions.ts-44-    // Add school isolation
src/lib/actions/idCardGenerationActions.ts-45-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/idCardGenerationActions.ts-46-    const schoolId = await getRequiredSchoolId();
src/lib/actions/idCardGenerationActions.ts-47-
--
src/lib/actions/idCardGenerationActions.ts-102- * Get ID card preview (Base64)
src/lib/actions/idCardGenerationActions.ts-103- */
src/lib/actions/idCardGenerationActions.ts:104:export async function getStudentIDCardPreview(studentId: string, academicYear: string, templateId: string = 'STANDARD'): Promise<PreviewResponse> {
src/lib/actions/idCardGenerationActions.ts-105-  try {
src/lib/actions/idCardGenerationActions.ts-106-    // Add school isolation
src/lib/actions/idCardGenerationActions.ts-107-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/idCardGenerationActions.ts-108-    const schoolId = await getRequiredSchoolId();
src/lib/actions/idCardGenerationActions.ts-109-
--
src/lib/actions/idCardGenerationActions.ts-129- * Generate ID cards for multiple students
src/lib/actions/idCardGenerationActions.ts-130- */
src/lib/actions/idCardGenerationActions.ts:131:export async function generateBulkStudentIDCards(
src/lib/actions/idCardGenerationActions.ts-132-  studentIds: string[],
src/lib/actions/idCardGenerationActions.ts-133-  academicYear: string,
src/lib/actions/idCardGenerationActions.ts-134-  templateId: string = 'STANDARD'
src/lib/actions/idCardGenerationActions.ts-135-) {
src/lib/actions/idCardGenerationActions.ts-136-  try {
--
src/lib/actions/idCardGenerationActions.ts-211- * Generate ID cards for all students in a class
src/lib/actions/idCardGenerationActions.ts-212- */
src/lib/actions/idCardGenerationActions.ts:213:export async function generateClassIDCards(
src/lib/actions/idCardGenerationActions.ts-214-  classId: string,
src/lib/actions/idCardGenerationActions.ts-215-  sectionId: string | null,
src/lib/actions/idCardGenerationActions.ts-216-  academicYear: string,
src/lib/actions/idCardGenerationActions.ts-217-  templateId: string = 'STANDARD'
src/lib/actions/idCardGenerationActions.ts-218-) {
--
src/lib/actions/idCardGenerationActions.ts-296- * Get ID card preview for a random student in a class
src/lib/actions/idCardGenerationActions.ts-297- */
src/lib/actions/idCardGenerationActions.ts:298:export async function getClassIDCardPreview(
src/lib/actions/idCardGenerationActions.ts-299-  classId: string,
src/lib/actions/idCardGenerationActions.ts-300-  academicYear: string,
src/lib/actions/idCardGenerationActions.ts-301-  templateId: string = 'STANDARD'
src/lib/actions/idCardGenerationActions.ts-302-): Promise<PreviewResponse> {
src/lib/actions/idCardGenerationActions.ts-303-  try {
--
src/lib/actions/idCardGenerationActions.ts-338- * Get list of classes for ID card generation
src/lib/actions/idCardGenerationActions.ts-339- */
src/lib/actions/idCardGenerationActions.ts:340:export async function getClassesForIDCardGeneration(): Promise<ActionResponse<ClassData[]>> {
src/lib/actions/idCardGenerationActions.ts-341-  try {
src/lib/actions/idCardGenerationActions.ts-342-    // Add school isolation
src/lib/actions/idCardGenerationActions.ts-343-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/idCardGenerationActions.ts-344-    const schoolId = await getRequiredSchoolId();
src/lib/actions/idCardGenerationActions.ts-345-
--
src/lib/actions/idCardGenerationActions.ts-400- * Get current academic year
src/lib/actions/idCardGenerationActions.ts-401- */
src/lib/actions/idCardGenerationActions.ts:402:export async function getCurrentAcademicYear(): Promise<ActionResponse<{ id: string; name?: string; year?: string }>> {
src/lib/actions/idCardGenerationActions.ts-403-  try {
src/lib/actions/idCardGenerationActions.ts-404-    // Add school isolation
src/lib/actions/idCardGenerationActions.ts-405-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/idCardGenerationActions.ts-406-    const schoolId = await getRequiredSchoolId();
src/lib/actions/idCardGenerationActions.ts-407-
--
src/lib/actions/attendanceReportActions.ts-4-import { AttendanceStatus } from "@prisma/client";
src/lib/actions/attendanceReportActions.ts-5-
src/lib/actions/attendanceReportActions.ts:6:export async function getDailyAttendanceSummary(date: Date, sectionId?: string) {
src/lib/actions/attendanceReportActions.ts-7-  try {
src/lib/actions/attendanceReportActions.ts-8-    // CRITICAL: Add school isolation
src/lib/actions/attendanceReportActions.ts-9-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/attendanceReportActions.ts-10-    const schoolId = await getRequiredSchoolId();
src/lib/actions/attendanceReportActions.ts-11-
--
src/lib/actions/attendanceReportActions.ts-81-}
src/lib/actions/attendanceReportActions.ts-82-
src/lib/actions/attendanceReportActions.ts:83:export async function getMonthlyAttendanceTrends(month: number, year: number, sectionId?: string) {
src/lib/actions/attendanceReportActions.ts-84-  try {
src/lib/actions/attendanceReportActions.ts-85-    // CRITICAL: Add school isolation
src/lib/actions/attendanceReportActions.ts-86-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/attendanceReportActions.ts-87-    const schoolId = await getRequiredSchoolId();
src/lib/actions/attendanceReportActions.ts-88-
--
src/lib/actions/attendanceReportActions.ts-136-}
src/lib/actions/attendanceReportActions.ts-137-
src/lib/actions/attendanceReportActions.ts:138:export async function getAbsenteeismAnalysis(filters?: {
src/lib/actions/attendanceReportActions.ts-139-  startDate?: Date;
src/lib/actions/attendanceReportActions.ts-140-  endDate?: Date;
src/lib/actions/attendanceReportActions.ts-141-  sectionId?: string;
src/lib/actions/attendanceReportActions.ts-142-}) {
src/lib/actions/attendanceReportActions.ts-143-  try {
--
src/lib/actions/attendanceReportActions.ts-219-}
src/lib/actions/attendanceReportActions.ts-220-
src/lib/actions/attendanceReportActions.ts:221:export async function getClassWiseAttendance(filters?: {
src/lib/actions/attendanceReportActions.ts-222-  startDate?: Date;
src/lib/actions/attendanceReportActions.ts-223-  endDate?: Date;
src/lib/actions/attendanceReportActions.ts-224-}) {
src/lib/actions/attendanceReportActions.ts-225-  try {
src/lib/actions/attendanceReportActions.ts-226-    // CRITICAL: Add school isolation
--
src/lib/actions/attendanceReportActions.ts-284-}
src/lib/actions/attendanceReportActions.ts-285-
src/lib/actions/attendanceReportActions.ts:286:export async function getPerfectAttendance(filters?: {
src/lib/actions/attendanceReportActions.ts-287-  startDate?: Date;
src/lib/actions/attendanceReportActions.ts-288-  endDate?: Date;
src/lib/actions/attendanceReportActions.ts-289-  sectionId?: string;
src/lib/actions/attendanceReportActions.ts-290-}) {
src/lib/actions/attendanceReportActions.ts-291-  try {
--
src/lib/actions/assessmentTimelineActions.ts-4-
src/lib/actions/assessmentTimelineActions.ts-5-// Get assessment timeline
src/lib/actions/assessmentTimelineActions.ts:6:export async function getAssessmentTimeline(dateFrom: Date, dateTo: Date) {
src/lib/actions/assessmentTimelineActions.ts-7-  try {
src/lib/actions/assessmentTimelineActions.ts-8-    // Add school isolation
src/lib/actions/assessmentTimelineActions.ts-9-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/assessmentTimelineActions.ts-10-    const schoolId = await getRequiredSchoolId();
src/lib/actions/assessmentTimelineActions.ts-11-
--
src/lib/actions/assessmentTimelineActions.ts-87-
src/lib/actions/assessmentTimelineActions.ts-88-// Get timeline by month
src/lib/actions/assessmentTimelineActions.ts:89:export async function getTimelineByMonth(year: number, month: number) {
src/lib/actions/assessmentTimelineActions.ts-90-  try {
src/lib/actions/assessmentTimelineActions.ts-91-    const dateFrom = new Date(year, month - 1, 1);
src/lib/actions/assessmentTimelineActions.ts-92-    const dateTo = new Date(year, month, 0, 23, 59, 59);
src/lib/actions/assessmentTimelineActions.ts-93-
src/lib/actions/assessmentTimelineActions.ts-94-    return await getAssessmentTimeline(dateFrom, dateTo);
--
src/lib/actions/assessmentTimelineActions.ts-100-
src/lib/actions/assessmentTimelineActions.ts-101-// Get upcoming assessments (next 30 days)
src/lib/actions/assessmentTimelineActions.ts:102:export async function getUpcomingAssessments() {
src/lib/actions/assessmentTimelineActions.ts-103-  try {
src/lib/actions/assessmentTimelineActions.ts-104-    const dateFrom = new Date();
src/lib/actions/assessmentTimelineActions.ts-105-    const dateTo = new Date();
src/lib/actions/assessmentTimelineActions.ts-106-    dateTo.setDate(dateTo.getDate() + 30);
src/lib/actions/assessmentTimelineActions.ts-107-
--
src/lib/actions/assessmentTimelineActions.ts-114-
src/lib/actions/assessmentTimelineActions.ts-115-// Get timeline statistics
src/lib/actions/assessmentTimelineActions.ts:116:export async function getTimelineStats(dateFrom: Date, dateTo: Date) {
src/lib/actions/assessmentTimelineActions.ts-117-  try {
src/lib/actions/assessmentTimelineActions.ts-118-    // Add school isolation
src/lib/actions/assessmentTimelineActions.ts-119-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/assessmentTimelineActions.ts-120-    const schoolId = await getRequiredSchoolId();
src/lib/actions/assessmentTimelineActions.ts-121-
--
src/lib/actions/bulkImportActions.ts-107- * Requirement 26.1: Validate data format and display errors before import
src/lib/actions/bulkImportActions.ts-108- */
src/lib/actions/bulkImportActions.ts:109:export async function validateImportData(
src/lib/actions/bulkImportActions.ts-110-  data: any[],
src/lib/actions/bulkImportActions.ts-111-  type: "student" | "teacher" | "parent"
src/lib/actions/bulkImportActions.ts-112-): Promise<{
src/lib/actions/bulkImportActions.ts-113-  valid: boolean;
src/lib/actions/bulkImportActions.ts-114-  errors: Array<{ row: number; field?: string; message: string }>;
--
src/lib/actions/bulkImportActions.ts-154- * Requirement 26.5: Provide options to skip, update, or create new records
src/lib/actions/bulkImportActions.ts-155- */
src/lib/actions/bulkImportActions.ts:156:export async function importStudents(
src/lib/actions/bulkImportActions.ts-157-  data: StudentImportData[],
src/lib/actions/bulkImportActions.ts-158-  duplicateHandling: DuplicateHandling = "skip",
src/lib/actions/bulkImportActions.ts-159-  defaultClassId?: string,
src/lib/actions/bulkImportActions.ts-160-  defaultSectionId?: string
src/lib/actions/bulkImportActions.ts-161-): Promise<ImportResult> {
--
src/lib/actions/bulkImportActions.ts-372- * Import teachers in bulk
src/lib/actions/bulkImportActions.ts-373- */
src/lib/actions/bulkImportActions.ts:374:export async function importTeachers(
src/lib/actions/bulkImportActions.ts-375-  data: TeacherImportData[],
src/lib/actions/bulkImportActions.ts-376-  duplicateHandling: DuplicateHandling = "skip"
src/lib/actions/bulkImportActions.ts-377-): Promise<ImportResult> {
src/lib/actions/bulkImportActions.ts-378-  const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/bulkImportActions.ts-379-  const userId = user?.id;
--
src/lib/actions/bulkImportActions.ts-526- * Import parents in bulk
src/lib/actions/bulkImportActions.ts-527- */
src/lib/actions/bulkImportActions.ts:528:export async function importParents(
src/lib/actions/bulkImportActions.ts-529-  data: ParentImportData[],
src/lib/actions/bulkImportActions.ts-530-  duplicateHandling: DuplicateHandling = "skip"
src/lib/actions/bulkImportActions.ts-531-): Promise<ImportResult> {
src/lib/actions/bulkImportActions.ts-532-  const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/bulkImportActions.ts-533-  const userId = user?.id;
--
src/lib/actions/graduationActions.ts-235- * @returns Graduation result with counts and failures
src/lib/actions/graduationActions.ts-236- */
src/lib/actions/graduationActions.ts:237:export async function markStudentsAsGraduated(
src/lib/actions/graduationActions.ts-238-  input: MarkStudentsAsGraduatedInput
src/lib/actions/graduationActions.ts-239-): Promise<GraduationResult> {
src/lib/actions/graduationActions.ts-240-  try {
src/lib/actions/graduationActions.ts-241-    // Authentication and authorization check
src/lib/actions/graduationActions.ts-242-    const authCheck = await checkAdminAuth();
--
src/lib/actions/graduationActions.ts-438- * @returns Graduation result with counts and failures
src/lib/actions/graduationActions.ts-439- */
src/lib/actions/graduationActions.ts:440:export async function bulkGraduateClass(
src/lib/actions/graduationActions.ts-441-  input: BulkGraduateClassInput
src/lib/actions/graduationActions.ts-442-): Promise<GraduationResult> {
src/lib/actions/graduationActions.ts-443-  try {
src/lib/actions/graduationActions.ts-444-    // Authentication and authorization check
src/lib/actions/graduationActions.ts-445-    const authCheck = await checkAdminAuth();
--
src/lib/actions/graduationActions.ts-555- * @returns List of students eligible for graduation
src/lib/actions/graduationActions.ts-556- */
src/lib/actions/graduationActions.ts:557:export async function getStudentsForGraduation(
src/lib/actions/graduationActions.ts-558-  classId: string,
src/lib/actions/graduationActions.ts-559-  sectionId: string | undefined,
src/lib/actions/graduationActions.ts-560-  academicYearId: string
src/lib/actions/graduationActions.ts-561-) {
src/lib/actions/graduationActions.ts-562-  try {
--
src/lib/actions/parent-document-actions.ts-72- * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
src/lib/actions/parent-document-actions.ts-73- */
src/lib/actions/parent-document-actions.ts:74:export async function getDocuments(filters: DocumentFilter) {
src/lib/actions/parent-document-actions.ts-75-  try {
src/lib/actions/parent-document-actions.ts-76-    // Add school isolation
src/lib/actions/parent-document-actions.ts-77-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-document-actions.ts-78-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-document-actions.ts-79-
--
src/lib/actions/parent-document-actions.ts-190- * Requirements: 7.2, 7.3
src/lib/actions/parent-document-actions.ts-191- */
src/lib/actions/parent-document-actions.ts:192:export async function downloadDocument(documentId: string) {
src/lib/actions/parent-document-actions.ts-193-  try {
src/lib/actions/parent-document-actions.ts-194-    // Add school isolation
src/lib/actions/parent-document-actions.ts-195-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-document-actions.ts-196-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-document-actions.ts-197-
--
src/lib/actions/parent-document-actions.ts-252- * Requirements: 7.2
src/lib/actions/parent-document-actions.ts-253- */
src/lib/actions/parent-document-actions.ts:254:export async function previewDocument(documentId: string) {
src/lib/actions/parent-document-actions.ts-255-  try {
src/lib/actions/parent-document-actions.ts-256-    // Add school isolation
src/lib/actions/parent-document-actions.ts-257-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-document-actions.ts-258-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-document-actions.ts-259-
--
src/lib/actions/parent-document-actions.ts-336- * Requirements: 7.1
src/lib/actions/parent-document-actions.ts-337- */
src/lib/actions/parent-document-actions.ts:338:export async function getDocumentCategories() {
src/lib/actions/parent-document-actions.ts-339-  try {
src/lib/actions/parent-document-actions.ts-340-    // Add school isolation
src/lib/actions/parent-document-actions.ts-341-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-document-actions.ts-342-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-document-actions.ts-343-
--
src/lib/actions/subModuleActions.ts-44- * Authorization: Admin only
src/lib/actions/subModuleActions.ts-45- */
src/lib/actions/subModuleActions.ts:46:export async function createSubModule(
src/lib/actions/subModuleActions.ts-47-  input: CreateSubModuleInput
src/lib/actions/subModuleActions.ts-48-): Promise<ActionResponse> {
src/lib/actions/subModuleActions.ts-49-  try {
src/lib/actions/subModuleActions.ts-50-    // Check authorization - only admins can create sub-modules
src/lib/actions/subModuleActions.ts-51-    const authResult = await requireModifyAccess();
--
src/lib/actions/subModuleActions.ts-123- * Authorization: Admin only
src/lib/actions/subModuleActions.ts-124- */
src/lib/actions/subModuleActions.ts:125:export async function updateSubModule(
src/lib/actions/subModuleActions.ts-126-  input: UpdateSubModuleInput
src/lib/actions/subModuleActions.ts-127-): Promise<ActionResponse> {
src/lib/actions/subModuleActions.ts-128-  try {
src/lib/actions/subModuleActions.ts-129-    // Check authorization - only admins can update sub-modules
src/lib/actions/subModuleActions.ts-130-    const authResult = await requireModifyAccess();
--
src/lib/actions/subModuleActions.ts-217- * Authorization: Admin only
src/lib/actions/subModuleActions.ts-218- */
src/lib/actions/subModuleActions.ts:219:export async function deleteSubModule(id: string): Promise<ActionResponse> {
src/lib/actions/subModuleActions.ts-220-  try {
src/lib/actions/subModuleActions.ts-221-    // Check authorization - only admins can delete sub-modules
src/lib/actions/subModuleActions.ts-222-    const authResult = await requireModifyAccess();
src/lib/actions/subModuleActions.ts-223-    if (!authResult.authorized) {
src/lib/actions/subModuleActions.ts-224-      return formatAuthError(authResult);
--
src/lib/actions/subModuleActions.ts-280- * Authorization: Admin only
src/lib/actions/subModuleActions.ts-281- */
src/lib/actions/subModuleActions.ts:282:export async function moveSubModule(
src/lib/actions/subModuleActions.ts-283-  input: MoveSubModuleInput
src/lib/actions/subModuleActions.ts-284-): Promise<ActionResponse> {
src/lib/actions/subModuleActions.ts-285-  try {
src/lib/actions/subModuleActions.ts-286-    // Check authorization - only admins can move sub-modules
src/lib/actions/subModuleActions.ts-287-    const authResult = await requireModifyAccess();
--
src/lib/actions/subModuleActions.ts-368- * Authorization: Admin only
src/lib/actions/subModuleActions.ts-369- */
src/lib/actions/subModuleActions.ts:370:export async function reorderSubModules(
src/lib/actions/subModuleActions.ts-371-  input: ReorderSubModulesInput
src/lib/actions/subModuleActions.ts-372-): Promise<ActionResponse> {
src/lib/actions/subModuleActions.ts-373-  try {
src/lib/actions/subModuleActions.ts-374-    // Check authorization - only admins can reorder sub-modules
src/lib/actions/subModuleActions.ts-375-    const authResult = await requireModifyAccess();
--
src/lib/actions/subModuleActions.ts-462- * Authorization: All authenticated users (admin, teacher, student)
src/lib/actions/subModuleActions.ts-463- */
src/lib/actions/subModuleActions.ts:464:export async function getSubModulesByModule(
src/lib/actions/subModuleActions.ts-465-  moduleId: string
src/lib/actions/subModuleActions.ts-466-): Promise<ActionResponse> {
src/lib/actions/subModuleActions.ts-467-  try {
src/lib/actions/subModuleActions.ts-468-    // Check authorization - all authenticated users can view
src/lib/actions/subModuleActions.ts-469-    const authResult = await requireViewAccess();
--
src/lib/actions/bulkMessagingActions.ts-54- * @returns Action result with delivery summary
src/lib/actions/bulkMessagingActions.ts-55- */
src/lib/actions/bulkMessagingActions.ts:56:export async function sendBulkToClass(data: {
src/lib/actions/bulkMessagingActions.ts-57-  classId: string;
src/lib/actions/bulkMessagingActions.ts-58-  sectionId?: string;
src/lib/actions/bulkMessagingActions.ts-59-  channel: CommunicationChannel;
src/lib/actions/bulkMessagingActions.ts-60-  title: string;
src/lib/actions/bulkMessagingActions.ts-61-  message: string;
--
src/lib/actions/bulkMessagingActions.ts-267- * @returns Action result with delivery summary
src/lib/actions/bulkMessagingActions.ts-268- */
src/lib/actions/bulkMessagingActions.ts:269:export async function sendBulkToAllParents(data: {
src/lib/actions/bulkMessagingActions.ts-270-  channel: CommunicationChannel;
src/lib/actions/bulkMessagingActions.ts-271-  title: string;
src/lib/actions/bulkMessagingActions.ts-272-  message: string;
src/lib/actions/bulkMessagingActions.ts-273-  notificationType?: NotificationType;
src/lib/actions/bulkMessagingActions.ts-274-  academicYearId?: string; // Optional: filter by academic year
--
src/lib/actions/bulkMessagingActions.ts-494- * @returns Action result with progress information
src/lib/actions/bulkMessagingActions.ts-495- */
src/lib/actions/bulkMessagingActions.ts:496:export async function getBulkMessageProgress(
src/lib/actions/bulkMessagingActions.ts-497-  auditLogId: string
src/lib/actions/bulkMessagingActions.ts-498-): Promise<
src/lib/actions/bulkMessagingActions.ts-499-  ActionResult<{
src/lib/actions/bulkMessagingActions.ts-500-    totalRecipients: number;
src/lib/actions/bulkMessagingActions.ts-501-    processed: number;
--
src/lib/actions/bulkMessagingActions.ts-603- * @returns Action result with bulk message history
src/lib/actions/bulkMessagingActions.ts-604- */
src/lib/actions/bulkMessagingActions.ts:605:export async function getBulkMessageHistory(
src/lib/actions/bulkMessagingActions.ts-606-  limit: number = 20
src/lib/actions/bulkMessagingActions.ts-607-): Promise<
src/lib/actions/bulkMessagingActions.ts-608-  ActionResult<
src/lib/actions/bulkMessagingActions.ts-609-    Array<{
src/lib/actions/bulkMessagingActions.ts-610-      id: string;
--
src/lib/actions/bulkMessagingActions.ts-734- * @returns Action result with delivery summary
src/lib/actions/bulkMessagingActions.ts-735- */
src/lib/actions/bulkMessagingActions.ts:736:export async function sendBulkMessage(
src/lib/actions/bulkMessagingActions.ts-737-  data: BulkMessageInput
src/lib/actions/bulkMessagingActions.ts-738-): Promise<ActionResult<BulkMessageSummary>> {
src/lib/actions/bulkMessagingActions.ts-739-  try {
src/lib/actions/bulkMessagingActions.ts-740-    // Add school isolation
src/lib/actions/bulkMessagingActions.ts-741-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
--
src/lib/actions/bulkMessagingActions.ts-936- * @returns Action result with recipient list
src/lib/actions/bulkMessagingActions.ts-937- */
src/lib/actions/bulkMessagingActions.ts:938:export async function previewRecipients(
src/lib/actions/bulkMessagingActions.ts-939-  data: Partial<BulkMessageInput>
src/lib/actions/bulkMessagingActions.ts-940-): Promise<ActionResult<BulkMessageRecipient[]>> {
src/lib/actions/bulkMessagingActions.ts-941-  try {
src/lib/actions/bulkMessagingActions.ts-942-    // Add school isolation
src/lib/actions/bulkMessagingActions.ts-943-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
--
src/lib/actions/bulkMessagingActions.ts-1108- * @returns Action result with class list
src/lib/actions/bulkMessagingActions.ts-1109- */
src/lib/actions/bulkMessagingActions.ts:1110:export async function getAvailableClasses(): Promise<
src/lib/actions/bulkMessagingActions.ts-1111-  ActionResult<Array<{ id: string; name: string; section?: string }>>
src/lib/actions/bulkMessagingActions.ts-1112-> {
src/lib/actions/bulkMessagingActions.ts-1113-  try {
src/lib/actions/bulkMessagingActions.ts-1114-    // Add school isolation
src/lib/actions/bulkMessagingActions.ts-1115-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
--
src/lib/actions/bulkMessagingActions.ts-1160- */
src/lib/actions/bulkMessagingActions.ts-1161-
src/lib/actions/bulkMessagingActions.ts:1162:export async function getBulkMessagingStats(): Promise<ActionResult<{
src/lib/actions/bulkMessagingActions.ts-1163-  totalUsers: number;
src/lib/actions/bulkMessagingActions.ts-1164-  totalParents: number;
src/lib/actions/bulkMessagingActions.ts-1165-  totalTeachers: number;
src/lib/actions/bulkMessagingActions.ts-1166-  totalStudents: number;
src/lib/actions/bulkMessagingActions.ts-1167-}>> {
--
src/lib/actions/teacher-communication-actions.ts-85- * Requirements: 3.1
src/lib/actions/teacher-communication-actions.ts-86- */
src/lib/actions/teacher-communication-actions.ts:87:export async function getMessages(filters?: z.infer<typeof getMessagesSchema>) {
src/lib/actions/teacher-communication-actions.ts-88-  try {
src/lib/actions/teacher-communication-actions.ts-89-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-90-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-91-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-92-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-179- * Requirements: 3.2, 10.1, 10.2, 10.4
src/lib/actions/teacher-communication-actions.ts-180- */
src/lib/actions/teacher-communication-actions.ts:181:export async function sendMessage(input: z.infer<typeof sendMessageSchema> & { csrfToken?: string }) {
src/lib/actions/teacher-communication-actions.ts-182-  try {
src/lib/actions/teacher-communication-actions.ts-183-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-184-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-185-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-186-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-286- * Requirements: 3.3
src/lib/actions/teacher-communication-actions.ts-287- */
src/lib/actions/teacher-communication-actions.ts:288:export async function getAnnouncements(filters?: z.infer<typeof getAnnouncementsSchema>) {
src/lib/actions/teacher-communication-actions.ts-289-  try {
src/lib/actions/teacher-communication-actions.ts-290-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-291-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-292-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-293-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-370- * Requirements: 3.4
src/lib/actions/teacher-communication-actions.ts-371- */
src/lib/actions/teacher-communication-actions.ts:372:export async function markAsRead(input: z.infer<typeof markAsReadSchema>) {
src/lib/actions/teacher-communication-actions.ts-373-  try {
src/lib/actions/teacher-communication-actions.ts-374-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-375-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-376-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-377-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-463- * Requirements: 3.5
src/lib/actions/teacher-communication-actions.ts-464- */
src/lib/actions/teacher-communication-actions.ts:465:export async function deleteMessage(input: z.infer<typeof deleteMessageSchema>) {
src/lib/actions/teacher-communication-actions.ts-466-  try {
src/lib/actions/teacher-communication-actions.ts-467-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-468-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-469-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-470-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-520- * Requirements: 3.4
src/lib/actions/teacher-communication-actions.ts-521- */
src/lib/actions/teacher-communication-actions.ts:522:export async function getUnreadMessageCount() {
src/lib/actions/teacher-communication-actions.ts-523-  try {
src/lib/actions/teacher-communication-actions.ts-524-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-525-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-526-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-527-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-554- * Requirements: 3.2
src/lib/actions/teacher-communication-actions.ts-555- */
src/lib/actions/teacher-communication-actions.ts:556:export async function getContacts() {
src/lib/actions/teacher-communication-actions.ts-557-  try {
src/lib/actions/teacher-communication-actions.ts-558-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-559-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-560-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-561-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/teacher-communication-actions.ts-594- * Requirements: 3.1
src/lib/actions/teacher-communication-actions.ts-595- */
src/lib/actions/teacher-communication-actions.ts:596:export async function getMessageById(id: string) {
src/lib/actions/teacher-communication-actions.ts-597-  try {
src/lib/actions/teacher-communication-actions.ts-598-    // Get current teacher
src/lib/actions/teacher-communication-actions.ts-599-    const teacherData = await getCurrentTeacher();
src/lib/actions/teacher-communication-actions.ts-600-    if (!teacherData) {
src/lib/actions/teacher-communication-actions.ts-601-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/cachedModuleActions.ts-11- * Cache duration: 5 minutes (MEDIUM)
src/lib/actions/cachedModuleActions.ts-12- */
src/lib/actions/cachedModuleActions.ts:13:export async function getCachedModulesBySyllabus(syllabusId: string) {
src/lib/actions/cachedModuleActions.ts-14-  // Check authorization first (not cached)
src/lib/actions/cachedModuleActions.ts-15-  const authResult = await requireViewAccess();
src/lib/actions/cachedModuleActions.ts-16-  if (!authResult.authorized) {
src/lib/actions/cachedModuleActions.ts-17-    return formatAuthError(authResult);
src/lib/actions/cachedModuleActions.ts-18-  }
--
src/lib/actions/cachedModuleActions.ts-75- * Cache duration: 5 minutes (MEDIUM)
src/lib/actions/cachedModuleActions.ts-76- */
src/lib/actions/cachedModuleActions.ts:77:export async function getCachedSubModulesByModule(moduleId: string) {
src/lib/actions/cachedModuleActions.ts-78-  // Check authorization first (not cached)
src/lib/actions/cachedModuleActions.ts-79-  const authResult = await requireViewAccess();
src/lib/actions/cachedModuleActions.ts-80-  if (!authResult.authorized) {
src/lib/actions/cachedModuleActions.ts-81-    return formatAuthError(authResult);
src/lib/actions/cachedModuleActions.ts-82-  }
--
src/lib/actions/cachedModuleActions.ts-130- * Requirements: Performance optimization with pagination
src/lib/actions/cachedModuleActions.ts-131- */
src/lib/actions/cachedModuleActions.ts:132:export async function getPaginatedModules(
src/lib/actions/cachedModuleActions.ts-133-  syllabusId: string,
src/lib/actions/cachedModuleActions.ts-134-  options: {
src/lib/actions/cachedModuleActions.ts-135-    page?: number;
src/lib/actions/cachedModuleActions.ts-136-    pageSize?: number;
src/lib/actions/cachedModuleActions.ts-137-    cursor?: string;
--
src/lib/actions/cachedModuleActions.ts-219- * Useful for detailed module view
src/lib/actions/cachedModuleActions.ts-220- */
src/lib/actions/cachedModuleActions.ts:221:export async function getCachedModuleById(moduleId: string) {
src/lib/actions/cachedModuleActions.ts-222-  // Check authorization first (not cached)
src/lib/actions/cachedModuleActions.ts-223-  const authResult = await requireViewAccess();
src/lib/actions/cachedModuleActions.ts-224-  if (!authResult.authorized) {
src/lib/actions/cachedModuleActions.ts-225-    return formatAuthError(authResult);
src/lib/actions/cachedModuleActions.ts-226-  }
--
src/lib/actions/cachedModuleActions.ts-294- * Requirements: 10.3, 10.4
src/lib/actions/cachedModuleActions.ts-295- */
src/lib/actions/cachedModuleActions.ts:296:export async function getCachedSyllabusProgress(syllabusId: string, teacherId: string) {
src/lib/actions/cachedModuleActions.ts-297-  // Check authorization first (not cached)
src/lib/actions/cachedModuleActions.ts-298-  const authResult = await requireViewAccess();
src/lib/actions/cachedModuleActions.ts-299-  if (!authResult.authorized) {
src/lib/actions/cachedModuleActions.ts-300-    return formatAuthError(authResult);
src/lib/actions/cachedModuleActions.ts-301-  }
--
src/lib/actions/importMarksActions.ts-68- * Import marks from file data with comprehensive validation
src/lib/actions/importMarksActions.ts-69- */
src/lib/actions/importMarksActions.ts:70:export async function importMarksFromFile(
src/lib/actions/importMarksActions.ts-71-  input: ImportMarksInput
src/lib/actions/importMarksActions.ts-72-): Promise<ImportResult> {
src/lib/actions/importMarksActions.ts-73-  try {
src/lib/actions/importMarksActions.ts-74-    // Get current user and school
src/lib/actions/importMarksActions.ts-75-    const { schoolId, user } = await requireSchoolAccess();
--
src/lib/actions/teacherProfileActions.ts-19- * Get teacher profile data
src/lib/actions/teacherProfileActions.ts-20- */
src/lib/actions/teacherProfileActions.ts:21:export async function getTeacherProfile() {
src/lib/actions/teacherProfileActions.ts-22-  try {
src/lib/actions/teacherProfileActions.ts-23-    const session = await auth();
src/lib/actions/teacherProfileActions.ts-24-    const userId = session?.user?.id;
src/lib/actions/teacherProfileActions.ts-25-
src/lib/actions/teacherProfileActions.ts-26-    if (!userId) {
--
src/lib/actions/teacherProfileActions.ts-262- * Update teacher profile information
src/lib/actions/teacherProfileActions.ts-263- */
src/lib/actions/teacherProfileActions.ts:264:export async function updateTeacherProfile(formData: FormData) {
src/lib/actions/teacherProfileActions.ts-265-  try {
src/lib/actions/teacherProfileActions.ts-266-    const session = await auth();
src/lib/actions/teacherProfileActions.ts-267-    const userId = session?.user?.id;
src/lib/actions/teacherProfileActions.ts-268-
src/lib/actions/teacherProfileActions.ts-269-    if (!userId) {
--
src/lib/actions/teacherProfileActions.ts-348- * Note: This function needs to be updated to use R2 storage instead of Cloudinary
src/lib/actions/teacherProfileActions.ts-349- */
src/lib/actions/teacherProfileActions.ts:350:export async function uploadTeacherAvatar(formData: FormData) {
src/lib/actions/teacherProfileActions.ts-351-  try {
src/lib/actions/teacherProfileActions.ts-352-    const session = await auth();
src/lib/actions/teacherProfileActions.ts-353-    const userId = session?.user?.id;
src/lib/actions/teacherProfileActions.ts-354-
src/lib/actions/teacherProfileActions.ts-355-    if (!userId) {
--
src/lib/actions/meritListActions.ts-12-
src/lib/actions/meritListActions.ts-13-// Create merit list configuration
src/lib/actions/meritListActions.ts:14:export async function createMeritListConfig(data: MeritListConfigFormValues) {
src/lib/actions/meritListActions.ts-15-  try {
src/lib/actions/meritListActions.ts-16-    // Get schoolId from current user context
src/lib/actions/meritListActions.ts-17-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/meritListActions.ts-18-    
src/lib/actions/meritListActions.ts-19-    // Validate the input data
--
src/lib/actions/meritListActions.ts-71-
src/lib/actions/meritListActions.ts-72-// Get all merit list configurations
src/lib/actions/meritListActions.ts:73:export async function getMeritListConfigs(classId?: string) {
src/lib/actions/meritListActions.ts-74-  try {
src/lib/actions/meritListActions.ts-75-    const where: any = {};
src/lib/actions/meritListActions.ts-76-
src/lib/actions/meritListActions.ts-77-    if (classId) {
src/lib/actions/meritListActions.ts-78-      where.appliedClassId = classId;
--
src/lib/actions/meritListActions.ts-112-
src/lib/actions/meritListActions.ts-113-// Get single merit list configuration
src/lib/actions/meritListActions.ts:114:export async function getMeritListConfigById(id: string) {
src/lib/actions/meritListActions.ts-115-  try {
src/lib/actions/meritListActions.ts-116-    const config = await db.meritListConfig.findUnique({
src/lib/actions/meritListActions.ts-117-      where: { id },
src/lib/actions/meritListActions.ts-118-      include: {
src/lib/actions/meritListActions.ts-119-        appliedClass: {
--
src/lib/actions/meritListActions.ts-155-
src/lib/actions/meritListActions.ts-156-// Update merit list configuration
src/lib/actions/meritListActions.ts:157:export async function updateMeritListConfig(
src/lib/actions/meritListActions.ts-158-  id: string,
src/lib/actions/meritListActions.ts-159-  data: MeritListConfigFormValues
src/lib/actions/meritListActions.ts-160-) {
src/lib/actions/meritListActions.ts-161-  try {
src/lib/actions/meritListActions.ts-162-    // Get schoolId from current user context
--
src/lib/actions/meritListActions.ts-217-
src/lib/actions/meritListActions.ts-218-// Delete merit list configuration
src/lib/actions/meritListActions.ts:219:export async function deleteMeritListConfig(id: string) {
src/lib/actions/meritListActions.ts-220-  try {
src/lib/actions/meritListActions.ts-221-    await db.meritListConfig.delete({
src/lib/actions/meritListActions.ts-222-      where: { id },
src/lib/actions/meritListActions.ts-223-    });
src/lib/actions/meritListActions.ts-224-
--
src/lib/actions/meritListActions.ts-313-
src/lib/actions/meritListActions.ts-314-// Generate merit list based on configuration
src/lib/actions/meritListActions.ts:315:export async function generateMeritList(
src/lib/actions/meritListActions.ts-316-  data: GenerateMeritListFormValues,
src/lib/actions/meritListActions.ts-317-  generatedBy?: string
src/lib/actions/meritListActions.ts-318-) {
src/lib/actions/meritListActions.ts-319-  try {
src/lib/actions/meritListActions.ts-320-    // Get schoolId from current user context
--
src/lib/actions/meritListActions.ts-440-
src/lib/actions/meritListActions.ts-441-// Get merit list by ID
src/lib/actions/meritListActions.ts:442:export async function getMeritListById(id: string) {
src/lib/actions/meritListActions.ts-443-  try {
src/lib/actions/meritListActions.ts-444-    const meritList = await db.meritList.findUnique({
src/lib/actions/meritListActions.ts-445-      where: { id },
src/lib/actions/meritListActions.ts-446-      include: {
src/lib/actions/meritListActions.ts-447-        config: {
--
src/lib/actions/meritListActions.ts-488-
src/lib/actions/meritListActions.ts-489-// Get all merit lists
src/lib/actions/meritListActions.ts:490:export async function getMeritLists(classId?: string) {
src/lib/actions/meritListActions.ts-491-  try {
src/lib/actions/meritListActions.ts-492-    const where: any = {};
src/lib/actions/meritListActions.ts-493-
src/lib/actions/meritListActions.ts-494-    if (classId) {
src/lib/actions/meritListActions.ts-495-      where.appliedClassId = classId;
--
src/lib/actions/meritListActions.ts-528-
src/lib/actions/meritListActions.ts-529-// Delete merit list
src/lib/actions/meritListActions.ts:530:export async function deleteMeritList(id: string) {
src/lib/actions/meritListActions.ts-531-  try {
src/lib/actions/meritListActions.ts-532-    await db.meritList.delete({
src/lib/actions/meritListActions.ts-533-      where: { id },
src/lib/actions/meritListActions.ts-534-    });
src/lib/actions/meritListActions.ts-535-
--
src/lib/actions/parentMeetingActions.ts-12-
src/lib/actions/parentMeetingActions.ts-13-// Get all parent meetings with filters
src/lib/actions/parentMeetingActions.ts:14:export async function getParentMeetings(filters?: {
src/lib/actions/parentMeetingActions.ts-15-  status?: string;
src/lib/actions/parentMeetingActions.ts-16-  teacherId?: string;
src/lib/actions/parentMeetingActions.ts-17-  parentId?: string;
src/lib/actions/parentMeetingActions.ts-18-  dateFrom?: Date;
src/lib/actions/parentMeetingActions.ts-19-  dateTo?: Date;
--
src/lib/actions/parentMeetingActions.ts-123-
src/lib/actions/parentMeetingActions.ts-124-// Get single parent meeting by ID
src/lib/actions/parentMeetingActions.ts:125:export async function getParentMeetingById(id: string) {
src/lib/actions/parentMeetingActions.ts-126-  try {
src/lib/actions/parentMeetingActions.ts-127-    if (!id) {
src/lib/actions/parentMeetingActions.ts-128-      return { success: false, error: "Meeting ID is required" };
src/lib/actions/parentMeetingActions.ts-129-    }
src/lib/actions/parentMeetingActions.ts-130-    
--
src/lib/actions/parentMeetingActions.ts-156-
src/lib/actions/parentMeetingActions.ts-157-// Schedule new parent meeting
src/lib/actions/parentMeetingActions.ts:158:export async function scheduleMeeting(data: any) {
src/lib/actions/parentMeetingActions.ts-159-  try {
src/lib/actions/parentMeetingActions.ts-160-    const user = await currentUser();
src/lib/actions/parentMeetingActions.ts-161-    const userId = user?.id || 'system';
src/lib/actions/parentMeetingActions.ts-162-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-163-    const schoolId = context.schoolId;
--
src/lib/actions/parentMeetingActions.ts-221-
src/lib/actions/parentMeetingActions.ts-222-// Update existing meeting
src/lib/actions/parentMeetingActions.ts:223:export async function updateMeeting(id: string, data: any) {
src/lib/actions/parentMeetingActions.ts-224-  try {
src/lib/actions/parentMeetingActions.ts-225-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-226-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-227-    
src/lib/actions/parentMeetingActions.ts-228-    if (!schoolId) {
--
src/lib/actions/parentMeetingActions.ts-265-
src/lib/actions/parentMeetingActions.ts-266-// Cancel meeting
src/lib/actions/parentMeetingActions.ts:267:export async function cancelMeeting(id: string, reason?: string) {
src/lib/actions/parentMeetingActions.ts-268-  try {
src/lib/actions/parentMeetingActions.ts-269-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-270-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-271-    
src/lib/actions/parentMeetingActions.ts-272-    if (!schoolId) {
--
src/lib/actions/parentMeetingActions.ts-294-
src/lib/actions/parentMeetingActions.ts-295-// Complete meeting
src/lib/actions/parentMeetingActions.ts:296:export async function completeMeeting(id: string, notes?: string) {
src/lib/actions/parentMeetingActions.ts-297-  try {
src/lib/actions/parentMeetingActions.ts-298-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-299-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-300-    
src/lib/actions/parentMeetingActions.ts-301-    if (!schoolId) {
--
src/lib/actions/parentMeetingActions.ts-320-
src/lib/actions/parentMeetingActions.ts-321-// Reschedule meeting
src/lib/actions/parentMeetingActions.ts:322:export async function rescheduleMeeting(id: string, newDate: Date) {
src/lib/actions/parentMeetingActions.ts-323-  try {
src/lib/actions/parentMeetingActions.ts-324-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-325-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-326-    
src/lib/actions/parentMeetingActions.ts-327-    if (!schoolId) {
--
src/lib/actions/parentMeetingActions.ts-361-
src/lib/actions/parentMeetingActions.ts-362-// Delete meeting
src/lib/actions/parentMeetingActions.ts:363:export async function deleteMeeting(id: string) {
src/lib/actions/parentMeetingActions.ts-364-  try {
src/lib/actions/parentMeetingActions.ts-365-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-366-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-367-    
src/lib/actions/parentMeetingActions.ts-368-    if (!schoolId) {
--
src/lib/actions/parentMeetingActions.ts-390-
src/lib/actions/parentMeetingActions.ts-391-// Get teachers for dropdown
src/lib/actions/parentMeetingActions.ts:392:export async function getTeachersForMeetings() {
src/lib/actions/parentMeetingActions.ts-393-  try {
src/lib/actions/parentMeetingActions.ts-394-    const teachers = await db.teacher.findMany({
src/lib/actions/parentMeetingActions.ts-395-      include: {
src/lib/actions/parentMeetingActions.ts-396-        user: {
src/lib/actions/parentMeetingActions.ts-397-          select: {
--
src/lib/actions/parentMeetingActions.ts-417-
src/lib/actions/parentMeetingActions.ts-418-// Get parents for dropdown
src/lib/actions/parentMeetingActions.ts:419:export async function getParentsForMeetings() {
src/lib/actions/parentMeetingActions.ts-420-  try {
src/lib/actions/parentMeetingActions.ts-421-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-422-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-423-    
src/lib/actions/parentMeetingActions.ts-424-    if (!schoolId) {
--
src/lib/actions/parentMeetingActions.ts-484-
src/lib/actions/parentMeetingActions.ts-485-// Get meeting statistics
src/lib/actions/parentMeetingActions.ts:486:export async function getMeetingStats() {
src/lib/actions/parentMeetingActions.ts-487-  try {
src/lib/actions/parentMeetingActions.ts-488-    const context = await requireSchoolAccess();
src/lib/actions/parentMeetingActions.ts-489-    const schoolId = context.schoolId;
src/lib/actions/parentMeetingActions.ts-490-    
src/lib/actions/parentMeetingActions.ts-491-    if (!schoolId) {
--
src/lib/actions/vehicleActions.ts-8-
src/lib/actions/vehicleActions.ts-9-// Get all vehicles with pagination and filters
src/lib/actions/vehicleActions.ts:10:export async function getVehicles(params?: {
src/lib/actions/vehicleActions.ts-11-  page?: number;
src/lib/actions/vehicleActions.ts-12-  limit?: number;
src/lib/actions/vehicleActions.ts-13-  search?: string;
src/lib/actions/vehicleActions.ts-14-  status?: string;
src/lib/actions/vehicleActions.ts-15-  vehicleType?: string;
--
src/lib/actions/vehicleActions.ts-83-
src/lib/actions/vehicleActions.ts-84-// Get a single vehicle by ID
src/lib/actions/vehicleActions.ts:85:export async function getVehicleById(id: string) {
src/lib/actions/vehicleActions.ts-86-  try {
src/lib/actions/vehicleActions.ts-87-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/vehicleActions.ts-88-    
src/lib/actions/vehicleActions.ts-89-    if (!schoolId) {
src/lib/actions/vehicleActions.ts-90-      throw new Error("School context required");
--
src/lib/actions/vehicleActions.ts-132-
src/lib/actions/vehicleActions.ts-133-// Create a new vehicle
src/lib/actions/vehicleActions.ts:134:export async function createVehicle(data: VehicleFormValues) {
src/lib/actions/vehicleActions.ts-135-  try {
src/lib/actions/vehicleActions.ts-136-    const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/vehicleActions.ts-137-    
src/lib/actions/vehicleActions.ts-138-    if (!schoolId) {
src/lib/actions/vehicleActions.ts-139-      throw new Error("School context required");
--
src/lib/actions/vehicleActions.ts-182-
src/lib/actions/vehicleActions.ts-183-// Update a vehicle
src/lib/actions/vehicleActions.ts:184:export async function updateVehicle(id: string, data: VehicleUpdateFormValues) {
src/lib/actions/vehicleActions.ts-185-  try {
src/lib/actions/vehicleActions.ts-186-    const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/vehicleActions.ts-187-    
src/lib/actions/vehicleActions.ts-188-    if (!schoolId) {
src/lib/actions/vehicleActions.ts-189-      throw new Error("School context required");
--
src/lib/actions/vehicleActions.ts-244-
src/lib/actions/vehicleActions.ts-245-// Delete a vehicle
src/lib/actions/vehicleActions.ts:246:export async function deleteVehicle(id: string) {
src/lib/actions/vehicleActions.ts-247-  try {
src/lib/actions/vehicleActions.ts-248-    const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/vehicleActions.ts-249-    
src/lib/actions/vehicleActions.ts-250-    if (!schoolId) {
src/lib/actions/vehicleActions.ts-251-      throw new Error("School context required");
--
src/lib/actions/vehicleActions.ts-292-
src/lib/actions/vehicleActions.ts-293-// Assign driver to vehicle
src/lib/actions/vehicleActions.ts:294:export async function assignDriverToVehicle(vehicleId: string, driverId: string | null) {
src/lib/actions/vehicleActions.ts-295-  try {
src/lib/actions/vehicleActions.ts-296-    const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/vehicleActions.ts-297-    
src/lib/actions/vehicleActions.ts-298-    if (!schoolId) {
src/lib/actions/vehicleActions.ts-299-      throw new Error("School context required");
--
src/lib/actions/vehicleActions.ts-345-
src/lib/actions/vehicleActions.ts-346-// Get vehicle statistics
src/lib/actions/vehicleActions.ts:347:export async function getVehicleStats() {
src/lib/actions/vehicleActions.ts-348-  try {
src/lib/actions/vehicleActions.ts-349-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/vehicleActions.ts-350-    
src/lib/actions/vehicleActions.ts-351-    if (!schoolId) {
src/lib/actions/vehicleActions.ts-352-      throw new Error("School context required");
--
src/lib/actions/departmentsAction.ts-5-import { revalidatePath } from "next/cache";
src/lib/actions/departmentsAction.ts-6-
src/lib/actions/departmentsAction.ts:7:export async function removeTeacherFromDepartment(teacherId: string, departmentId: string) {
src/lib/actions/departmentsAction.ts-8-  try {
src/lib/actions/departmentsAction.ts-9-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/departmentsAction.ts-10-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/departmentsAction.ts-11-
src/lib/actions/departmentsAction.ts-12-    // Verify the teacher and department belong to the school
--
src/lib/actions/departmentsAction.ts-61-}
src/lib/actions/departmentsAction.ts-62-
src/lib/actions/departmentsAction.ts:63:export async function assignTeacherToDepartment(teacherId: string, departmentId: string) {
src/lib/actions/departmentsAction.ts-64-  try {
src/lib/actions/departmentsAction.ts-65-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/departmentsAction.ts-66-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/departmentsAction.ts-67-
src/lib/actions/departmentsAction.ts-68-    // Verify the teacher and department belong to the school
--
src/lib/actions/departmentsAction.ts-132-}
src/lib/actions/departmentsAction.ts-133-
src/lib/actions/departmentsAction.ts:134:export async function getDepartments() {
src/lib/actions/departmentsAction.ts-135-  try {
src/lib/actions/departmentsAction.ts-136-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/departmentsAction.ts-137-    if (!schoolId) return { success: false, error: "School context required", departments: [] };
src/lib/actions/departmentsAction.ts-138-
src/lib/actions/departmentsAction.ts-139-    const departments = await db.department.findMany({
--
src/lib/actions/storage-actions.ts-22-}
src/lib/actions/storage-actions.ts-23-
src/lib/actions/storage-actions.ts:24:export async function getStorageAnalytics(): Promise<{ success: boolean; data?: StorageAnalytics; error?: string }> {
src/lib/actions/storage-actions.ts-25-  try {
src/lib/actions/storage-actions.ts-26-    await requireSuperAdminAccess();
src/lib/actions/storage-actions.ts-27-
src/lib/actions/storage-actions.ts-28-    // Check if R2 is configured
src/lib/actions/storage-actions.ts-29-    const r2Config = getR2Config();
--
src/lib/actions/hostelActions.ts-20-// ============================================
src/lib/actions/hostelActions.ts-21-
src/lib/actions/hostelActions.ts:22:export async function createHostel(data: {
src/lib/actions/hostelActions.ts-23-  name: string;
src/lib/actions/hostelActions.ts-24-  address?: string;
src/lib/actions/hostelActions.ts-25-  capacity: number;
src/lib/actions/hostelActions.ts-26-  wardenId?: string;
src/lib/actions/hostelActions.ts-27-  wardenName?: string;
--
src/lib/actions/hostelActions.ts-53-}
src/lib/actions/hostelActions.ts-54-
src/lib/actions/hostelActions.ts:55:export async function updateHostel(
src/lib/actions/hostelActions.ts-56-  id: string,
src/lib/actions/hostelActions.ts-57-  data: {
src/lib/actions/hostelActions.ts-58-    name?: string;
src/lib/actions/hostelActions.ts-59-    address?: string;
src/lib/actions/hostelActions.ts-60-    capacity?: number;
--
src/lib/actions/hostelActions.ts-95-}
src/lib/actions/hostelActions.ts-96-
src/lib/actions/hostelActions.ts:97:export async function getHostels() {
src/lib/actions/hostelActions.ts-98-  try {
src/lib/actions/hostelActions.ts-99-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-100-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-101-
src/lib/actions/hostelActions.ts-102-    const hostels = await prisma.hostel.findMany({
--
src/lib/actions/hostelActions.ts-128-}
src/lib/actions/hostelActions.ts-129-
src/lib/actions/hostelActions.ts:130:export async function getHostelById(id: string) {
src/lib/actions/hostelActions.ts-131-  try {
src/lib/actions/hostelActions.ts-132-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-133-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-134-
src/lib/actions/hostelActions.ts-135-    const hostel = await prisma.hostel.findFirst({
--
src/lib/actions/hostelActions.ts-176-}
src/lib/actions/hostelActions.ts-177-
src/lib/actions/hostelActions.ts:178:export async function deleteHostel(id: string) {
src/lib/actions/hostelActions.ts-179-  try {
src/lib/actions/hostelActions.ts-180-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-181-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-182-
src/lib/actions/hostelActions.ts-183-    // Verify ownership
--
src/lib/actions/hostelActions.ts-206-// ============================================
src/lib/actions/hostelActions.ts-207-
src/lib/actions/hostelActions.ts:208:export async function createHostelRoom(data: {
src/lib/actions/hostelActions.ts-209-  hostelId: string;
src/lib/actions/hostelActions.ts-210-  roomNumber: string;
src/lib/actions/hostelActions.ts-211-  floor?: number;
src/lib/actions/hostelActions.ts-212-  roomType: RoomType;
src/lib/actions/hostelActions.ts-213-  capacity: number;
--
src/lib/actions/hostelActions.ts-248-}
src/lib/actions/hostelActions.ts-249-
src/lib/actions/hostelActions.ts:250:export async function updateHostelRoom(
src/lib/actions/hostelActions.ts-251-  id: string,
src/lib/actions/hostelActions.ts-252-  data: {
src/lib/actions/hostelActions.ts-253-    roomNumber?: string;
src/lib/actions/hostelActions.ts-254-    floor?: number;
src/lib/actions/hostelActions.ts-255-    roomType?: RoomType;
--
src/lib/actions/hostelActions.ts-286-}
src/lib/actions/hostelActions.ts-287-
src/lib/actions/hostelActions.ts:288:export async function getHostelRooms(hostelId: string) {
src/lib/actions/hostelActions.ts-289-  try {
src/lib/actions/hostelActions.ts-290-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-291-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-292-
src/lib/actions/hostelActions.ts-293-    const rooms = await prisma.hostelRoom.findMany({
--
src/lib/actions/hostelActions.ts-323-}
src/lib/actions/hostelActions.ts-324-
src/lib/actions/hostelActions.ts:325:export async function deleteHostelRoom(id: string) {
src/lib/actions/hostelActions.ts-326-  try {
src/lib/actions/hostelActions.ts-327-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-328-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-329-
src/lib/actions/hostelActions.ts-330-    const existing = await prisma.hostelRoom.findFirst({
--
src/lib/actions/hostelActions.ts-352-// ============================================
src/lib/actions/hostelActions.ts-353-
src/lib/actions/hostelActions.ts:354:export async function allocateRoom(data: {
src/lib/actions/hostelActions.ts-355-  roomId: string;
src/lib/actions/hostelActions.ts-356-  studentId: string;
src/lib/actions/hostelActions.ts-357-  bedNumber?: string;
src/lib/actions/hostelActions.ts-358-  remarks?: string;
src/lib/actions/hostelActions.ts-359-}) {
--
src/lib/actions/hostelActions.ts-419-}
src/lib/actions/hostelActions.ts-420-
src/lib/actions/hostelActions.ts:421:export async function vacateRoom(allocationId: string, remarks?: string) {
src/lib/actions/hostelActions.ts-422-  try {
src/lib/actions/hostelActions.ts-423-    const { schoolId, user } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-424-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-425-    const userId = user.id;
src/lib/actions/hostelActions.ts-426-
--
src/lib/actions/hostelActions.ts-461-}
src/lib/actions/hostelActions.ts-462-
src/lib/actions/hostelActions.ts:463:export async function getRoomAllocations(roomId: string) {
src/lib/actions/hostelActions.ts-464-  try {
src/lib/actions/hostelActions.ts-465-    const allocations = await prisma.hostelRoomAllocation.findMany({
src/lib/actions/hostelActions.ts-466-      where: { roomId },
src/lib/actions/hostelActions.ts-467-      include: {
src/lib/actions/hostelActions.ts-468-        student: {
--
src/lib/actions/hostelActions.ts-489-}
src/lib/actions/hostelActions.ts-490-
src/lib/actions/hostelActions.ts:491:export async function getStudentAllocation(studentId: string) {
src/lib/actions/hostelActions.ts-492-  try {
src/lib/actions/hostelActions.ts-493-    const allocation = await prisma.hostelRoomAllocation.findFirst({
src/lib/actions/hostelActions.ts-494-      where: {
src/lib/actions/hostelActions.ts-495-        studentId,
src/lib/actions/hostelActions.ts-496-        status: AllocationStatus.ACTIVE,
--
src/lib/actions/hostelActions.ts-516-// ============================================
src/lib/actions/hostelActions.ts-517-
src/lib/actions/hostelActions.ts:518:export async function logVisitorEntry(data: {
src/lib/actions/hostelActions.ts-519-  studentId: string;
src/lib/actions/hostelActions.ts-520-  visitorName: string;
src/lib/actions/hostelActions.ts-521-  visitorPhone?: string;
src/lib/actions/hostelActions.ts-522-  visitorRelation?: string;
src/lib/actions/hostelActions.ts-523-  purpose?: string;
--
src/lib/actions/hostelActions.ts-555-}
src/lib/actions/hostelActions.ts-556-
src/lib/actions/hostelActions.ts:557:export async function logVisitorExit(visitorId: string) {
src/lib/actions/hostelActions.ts-558-  try {
src/lib/actions/hostelActions.ts-559-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-560-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/hostelActions.ts-561-
src/lib/actions/hostelActions.ts-562-    const visitor = await prisma.hostelVisitor.update({
--
src/lib/actions/hostelActions.ts-575-}
src/lib/actions/hostelActions.ts-576-
src/lib/actions/hostelActions.ts:577:export async function getVisitors(studentId?: string, date?: Date) {
src/lib/actions/hostelActions.ts-578-  try {
src/lib/actions/hostelActions.ts-579-    const where: any = {};
src/lib/actions/hostelActions.ts-580-    if (studentId) {
src/lib/actions/hostelActions.ts-581-      where.studentId = studentId;
src/lib/actions/hostelActions.ts-582-    }
--
src/lib/actions/hostelActions.ts-630-// ============================================
src/lib/actions/hostelActions.ts-631-
src/lib/actions/hostelActions.ts:632:export async function generateHostelFee(data: {
src/lib/actions/hostelActions.ts-633-  allocationId: string;
src/lib/actions/hostelActions.ts-634-  month: number;
src/lib/actions/hostelActions.ts-635-  year: number;
src/lib/actions/hostelActions.ts-636-  roomFee: number;
src/lib/actions/hostelActions.ts-637-  messFee: number;
--
src/lib/actions/hostelActions.ts-675-}
src/lib/actions/hostelActions.ts-676-
src/lib/actions/hostelActions.ts:677:export async function recordHostelFeePayment(
src/lib/actions/hostelActions.ts-678-  feeId: string,
src/lib/actions/hostelActions.ts-679-  data: {
src/lib/actions/hostelActions.ts-680-    paidAmount: number;
src/lib/actions/hostelActions.ts-681-    paymentDate: Date;
src/lib/actions/hostelActions.ts-682-    paymentMethod: PaymentMethod;
--
src/lib/actions/hostelActions.ts-735-}
src/lib/actions/hostelActions.ts-736-
src/lib/actions/hostelActions.ts:737:export async function getHostelFees(allocationId?: string, status?: PaymentStatus) {
src/lib/actions/hostelActions.ts-738-  try {
src/lib/actions/hostelActions.ts-739-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/hostelActions.ts-740-    const where: any = {
src/lib/actions/hostelActions.ts-741-      allocation: { schoolId }
src/lib/actions/hostelActions.ts-742-    };
--
src/lib/actions/hostelActions.ts-785-// ============================================
src/lib/actions/hostelActions.ts-786-
src/lib/actions/hostelActions.ts:787:export async function createHostelComplaint(data: {
src/lib/actions/hostelActions.ts-788-  hostelId: string;
src/lib/actions/hostelActions.ts-789-  studentId: string;
src/lib/actions/hostelActions.ts-790-  category: ComplaintCategory;
src/lib/actions/hostelActions.ts-791-  subject: string;
src/lib/actions/hostelActions.ts-792-  description: string;
--
src/lib/actions/hostelActions.ts-820-}
src/lib/actions/hostelActions.ts-821-
src/lib/actions/hostelActions.ts:822:export async function updateComplaintStatus(
src/lib/actions/hostelActions.ts-823-  complaintId: string,
src/lib/actions/hostelActions.ts-824-  data: {
src/lib/actions/hostelActions.ts-825-    status: ComplaintStatus;
src/lib/actions/hostelActions.ts-826-    assignedTo?: string;
src/lib/actions/hostelActions.ts-827-    resolvedBy?: string;
--
src/lib/actions/hostelActions.ts-865-}
src/lib/actions/hostelActions.ts-866-
src/lib/actions/hostelActions.ts:867:export async function getHostelComplaints(
src/lib/actions/hostelActions.ts-868-  hostelId?: string,
src/lib/actions/hostelActions.ts-869-  status?: ComplaintStatus,
src/lib/actions/hostelActions.ts-870-  studentId?: string
src/lib/actions/hostelActions.ts-871-) {
src/lib/actions/hostelActions.ts-872-  try {
--
src/lib/actions/hostelActions.ts-913-}
src/lib/actions/hostelActions.ts-914-
src/lib/actions/hostelActions.ts:915:export async function getComplaintById(complaintId: string) {
src/lib/actions/hostelActions.ts-916-  try {
src/lib/actions/hostelActions.ts-917-    const complaint = await prisma.hostelComplaint.findUnique({
src/lib/actions/hostelActions.ts-918-      where: { id: complaintId },
src/lib/actions/hostelActions.ts-919-      include: {
src/lib/actions/hostelActions.ts-920-        hostel: true,
--
src/lib/actions/monitoringActions.ts-116- * @returns Real-time metrics
src/lib/actions/monitoringActions.ts-117- */
src/lib/actions/monitoringActions.ts:118:export async function getRealTimeMetrics(): Promise<RealTimeMetrics> {
src/lib/actions/monitoringActions.ts-119-  try {
src/lib/actions/monitoringActions.ts-120-    await requireAdmin();
src/lib/actions/monitoringActions.ts-121-
src/lib/actions/monitoringActions.ts-122-    const now = new Date();
src/lib/actions/monitoringActions.ts-123-    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
--
src/lib/actions/monitoringActions.ts-267- * @returns Array of channel health statuses
src/lib/actions/monitoringActions.ts-268- */
src/lib/actions/monitoringActions.ts:269:export async function getChannelHealth(): Promise<ChannelHealth[]> {
src/lib/actions/monitoringActions.ts-270-  try {
src/lib/actions/monitoringActions.ts-271-    await requireAdmin();
src/lib/actions/monitoringActions.ts-272-
src/lib/actions/monitoringActions.ts-273-    const now = new Date();
src/lib/actions/monitoringActions.ts-274-    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
--
src/lib/actions/monitoringActions.ts-366- * @returns Error logs result
src/lib/actions/monitoringActions.ts-367- */
src/lib/actions/monitoringActions.ts:368:export async function getErrorLogsAction(params: {
src/lib/actions/monitoringActions.ts-369-  category?: ErrorCategory;
src/lib/actions/monitoringActions.ts-370-  severity?: ErrorSeverity;
src/lib/actions/monitoringActions.ts-371-  channel?: CommunicationChannel;
src/lib/actions/monitoringActions.ts-372-  resolved?: boolean;
src/lib/actions/monitoringActions.ts-373-  startDate?: Date;
--
src/lib/actions/monitoringActions.ts-393- * @returns Error statistics
src/lib/actions/monitoringActions.ts-394- */
src/lib/actions/monitoringActions.ts:395:export async function getErrorStatisticsAction(
src/lib/actions/monitoringActions.ts-396-  startDate?: Date,
src/lib/actions/monitoringActions.ts-397-  endDate?: Date
src/lib/actions/monitoringActions.ts-398-): Promise<ErrorStatistics> {
src/lib/actions/monitoringActions.ts-399-  try {
src/lib/actions/monitoringActions.ts-400-    await requireAdmin();
--
src/lib/actions/monitoringActions.ts-412- * @returns Success status
src/lib/actions/monitoringActions.ts-413- */
src/lib/actions/monitoringActions.ts:414:export async function resolveErrorAction(errorId: string): Promise<{ success: boolean }> {
src/lib/actions/monitoringActions.ts-415-  try {
src/lib/actions/monitoringActions.ts-416-    const user = await requireAdmin();
src/lib/actions/monitoringActions.ts-417-    await resolveError(errorId, user.id);
src/lib/actions/monitoringActions.ts-418-    return { success: true };
src/lib/actions/monitoringActions.ts-419-  } catch (error: any) {
--
src/lib/actions/monitoringActions.ts-434- * @returns Message logs result
src/lib/actions/monitoringActions.ts-435- */
src/lib/actions/monitoringActions.ts:436:export async function getRecentMessages(params: {
src/lib/actions/monitoringActions.ts-437-  channel?: CommunicationChannel;
src/lib/actions/monitoringActions.ts-438-  limit?: number;
src/lib/actions/monitoringActions.ts-439-}): Promise<MessageLogsResult> {
src/lib/actions/monitoringActions.ts-440-  try {
src/lib/actions/monitoringActions.ts-441-    await requireAdmin();
--
src/lib/actions/monitoringActions.ts-460- * @returns Message statistics by channel
src/lib/actions/monitoringActions.ts-461- */
src/lib/actions/monitoringActions.ts:462:export async function getMessageStatsByChannelAction(
src/lib/actions/monitoringActions.ts-463-  startDate?: Date,
src/lib/actions/monitoringActions.ts-464-  endDate?: Date
src/lib/actions/monitoringActions.ts-465-): Promise<Array<{
src/lib/actions/monitoringActions.ts-466-  channel: CommunicationChannel;
src/lib/actions/monitoringActions.ts-467-  total: number;
--
src/lib/actions/monitoringActions.ts-492- * @returns Time series data for errors
src/lib/actions/monitoringActions.ts-493- */
src/lib/actions/monitoringActions.ts:494:export async function getErrorTimeSeriesData(
src/lib/actions/monitoringActions.ts-495-  startDate: Date,
src/lib/actions/monitoringActions.ts-496-  endDate: Date
src/lib/actions/monitoringActions.ts-497-): Promise<Array<{
src/lib/actions/monitoringActions.ts-498-  date: string;
src/lib/actions/monitoringActions.ts-499-  total: number;
--
src/lib/actions/monitoringActions.ts-583- * @returns Time series data for messages
src/lib/actions/monitoringActions.ts-584- */
src/lib/actions/monitoringActions.ts:585:export async function getMessageTimeSeriesData(
src/lib/actions/monitoringActions.ts-586-  startDate: Date,
src/lib/actions/monitoringActions.ts-587-  endDate: Date
src/lib/actions/monitoringActions.ts-588-): Promise<Array<{
src/lib/actions/monitoringActions.ts-589-  date: string;
src/lib/actions/monitoringActions.ts-590-  SMS: number;
--
src/lib/actions/syllabusDocumentActions.ts-63- * Requirements: 3.4
src/lib/actions/syllabusDocumentActions.ts-64- */
src/lib/actions/syllabusDocumentActions.ts:65:export async function validateFileType(
src/lib/actions/syllabusDocumentActions.ts-66-  input: FileTypeValidationInput
src/lib/actions/syllabusDocumentActions.ts-67-): Promise<ActionResponse<{ valid: boolean; message?: string }>> {
src/lib/actions/syllabusDocumentActions.ts-68-  try {
src/lib/actions/syllabusDocumentActions.ts-69-    // Validate input with Zod schema
src/lib/actions/syllabusDocumentActions.ts-70-    const validationResult = fileTypeValidationSchema.safeParse(input);
--
src/lib/actions/syllabusDocumentActions.ts-125- * Authorization: Admin only
src/lib/actions/syllabusDocumentActions.ts-126- */
src/lib/actions/syllabusDocumentActions.ts:127:export async function uploadDocument(
src/lib/actions/syllabusDocumentActions.ts-128-  input: UploadDocumentInput
src/lib/actions/syllabusDocumentActions.ts-129-): Promise<ActionResponse> {
src/lib/actions/syllabusDocumentActions.ts-130-  try {
src/lib/actions/syllabusDocumentActions.ts-131-    // Check authorization - only admins can upload documents
src/lib/actions/syllabusDocumentActions.ts-132-    const authResult = await requireModifyAccess();
--
src/lib/actions/syllabusDocumentActions.ts-254- * Authorization: Admin only
src/lib/actions/syllabusDocumentActions.ts-255- */
src/lib/actions/syllabusDocumentActions.ts:256:export async function bulkUploadDocuments(
src/lib/actions/syllabusDocumentActions.ts-257-  input: BulkUploadDocumentsInput
src/lib/actions/syllabusDocumentActions.ts-258-): Promise<BulkUploadResponse> {
src/lib/actions/syllabusDocumentActions.ts-259-  try {
src/lib/actions/syllabusDocumentActions.ts-260-    // Check authorization - only admins can upload documents
src/lib/actions/syllabusDocumentActions.ts-261-    const authResult = await requireModifyAccess();
--
src/lib/actions/syllabusDocumentActions.ts-335- * Authorization: Admin only
src/lib/actions/syllabusDocumentActions.ts-336- */
src/lib/actions/syllabusDocumentActions.ts:337:export async function updateDocumentMetadata(
src/lib/actions/syllabusDocumentActions.ts-338-  input: UpdateDocumentMetadataInput
src/lib/actions/syllabusDocumentActions.ts-339-): Promise<ActionResponse> {
src/lib/actions/syllabusDocumentActions.ts-340-  try {
src/lib/actions/syllabusDocumentActions.ts-341-    // Check authorization - only admins can update documents
src/lib/actions/syllabusDocumentActions.ts-342-    const authResult = await requireModifyAccess();
--
src/lib/actions/syllabusDocumentActions.ts-405- * Authorization: Admin only
src/lib/actions/syllabusDocumentActions.ts-406- */
src/lib/actions/syllabusDocumentActions.ts:407:export async function deleteDocument(id: string): Promise<ActionResponse> {
src/lib/actions/syllabusDocumentActions.ts-408-  try {
src/lib/actions/syllabusDocumentActions.ts-409-    // Check authorization - only admins can delete documents
src/lib/actions/syllabusDocumentActions.ts-410-    const authResult = await requireModifyAccess();
src/lib/actions/syllabusDocumentActions.ts-411-    if (!authResult.authorized) {
src/lib/actions/syllabusDocumentActions.ts-412-      return formatAuthError(authResult);
--
src/lib/actions/syllabusDocumentActions.ts-492- * Authorization: Admin only
src/lib/actions/syllabusDocumentActions.ts-493- */
src/lib/actions/syllabusDocumentActions.ts:494:export async function reorderDocuments(
src/lib/actions/syllabusDocumentActions.ts-495-  input: ReorderDocumentsInput
src/lib/actions/syllabusDocumentActions.ts-496-): Promise<ActionResponse> {
src/lib/actions/syllabusDocumentActions.ts-497-  try {
src/lib/actions/syllabusDocumentActions.ts-498-    // Check authorization - only admins can reorder documents
src/lib/actions/syllabusDocumentActions.ts-499-    const authResult = await requireModifyAccess();
--
src/lib/actions/syllabusDocumentActions.ts-572- * Authorization: All authenticated users (admin, teacher, student)
src/lib/actions/syllabusDocumentActions.ts-573- */
src/lib/actions/syllabusDocumentActions.ts:574:export async function getDocumentsByParent(
src/lib/actions/syllabusDocumentActions.ts-575-  parentId: string,
src/lib/actions/syllabusDocumentActions.ts-576-  parentType: "module" | "subModule"
src/lib/actions/syllabusDocumentActions.ts-577-): Promise<ActionResponse> {
src/lib/actions/syllabusDocumentActions.ts-578-  try {
src/lib/actions/syllabusDocumentActions.ts-579-    // Check authorization - all authenticated users can view documents
--
src/lib/actions/scholarshipActions.ts-6-
src/lib/actions/scholarshipActions.ts-7-// Get all scholarships
src/lib/actions/scholarshipActions.ts:8:export async function getScholarships(filters?: {
src/lib/actions/scholarshipActions.ts-9-  limit?: number;
src/lib/actions/scholarshipActions.ts-10-}) {
src/lib/actions/scholarshipActions.ts-11-  try {
src/lib/actions/scholarshipActions.ts-12-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-13-    
--
src/lib/actions/scholarshipActions.ts-59-
src/lib/actions/scholarshipActions.ts-60-// Get single scholarship by ID
src/lib/actions/scholarshipActions.ts:61:export async function getScholarshipById(id: string) {
src/lib/actions/scholarshipActions.ts-62-  try {
src/lib/actions/scholarshipActions.ts-63-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-64-    
src/lib/actions/scholarshipActions.ts-65-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-66-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-103-
src/lib/actions/scholarshipActions.ts-104-// Create new scholarship
src/lib/actions/scholarshipActions.ts:105:export async function createScholarship(data: any) {
src/lib/actions/scholarshipActions.ts-106-  try {
src/lib/actions/scholarshipActions.ts-107-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-108-    
src/lib/actions/scholarshipActions.ts-109-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-110-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-133-
src/lib/actions/scholarshipActions.ts-134-// Update scholarship
src/lib/actions/scholarshipActions.ts:135:export async function updateScholarship(id: string, data: any) {
src/lib/actions/scholarshipActions.ts-136-  try {
src/lib/actions/scholarshipActions.ts-137-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-138-    
src/lib/actions/scholarshipActions.ts-139-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-140-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-163-
src/lib/actions/scholarshipActions.ts-164-// Delete scholarship
src/lib/actions/scholarshipActions.ts:165:export async function deleteScholarship(id: string) {
src/lib/actions/scholarshipActions.ts-166-  try {
src/lib/actions/scholarshipActions.ts-167-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-168-    
src/lib/actions/scholarshipActions.ts-169-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-170-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-199-
src/lib/actions/scholarshipActions.ts-200-// Get scholarship recipients
src/lib/actions/scholarshipActions.ts:201:export async function getScholarshipRecipients(scholarshipId: string) {
src/lib/actions/scholarshipActions.ts-202-  try {
src/lib/actions/scholarshipActions.ts-203-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-204-    
src/lib/actions/scholarshipActions.ts-205-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-206-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-239-
src/lib/actions/scholarshipActions.ts-240-// Award scholarship to student
src/lib/actions/scholarshipActions.ts:241:export async function awardScholarship(data: any) {
src/lib/actions/scholarshipActions.ts-242-  try {
src/lib/actions/scholarshipActions.ts-243-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-244-    
src/lib/actions/scholarshipActions.ts-245-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-246-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-316-
src/lib/actions/scholarshipActions.ts-317-// Remove scholarship recipient
src/lib/actions/scholarshipActions.ts:318:export async function removeRecipient(id: string) {
src/lib/actions/scholarshipActions.ts-319-  try {
src/lib/actions/scholarshipActions.ts-320-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-321-    
src/lib/actions/scholarshipActions.ts-322-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-323-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-340-
src/lib/actions/scholarshipActions.ts-341-// Get students for scholarship award
src/lib/actions/scholarshipActions.ts:342:export async function getStudentsForScholarship() {
src/lib/actions/scholarshipActions.ts-343-  try {
src/lib/actions/scholarshipActions.ts-344-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-345-    
src/lib/actions/scholarshipActions.ts-346-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-347-      throw new Error("School context required");
--
src/lib/actions/scholarshipActions.ts-383-
src/lib/actions/scholarshipActions.ts-384-// Get scholarship statistics
src/lib/actions/scholarshipActions.ts:385:export async function getScholarshipStats() {
src/lib/actions/scholarshipActions.ts-386-  try {
src/lib/actions/scholarshipActions.ts-387-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scholarshipActions.ts-388-    
src/lib/actions/scholarshipActions.ts-389-    if (!schoolId) {
src/lib/actions/scholarshipActions.ts-390-      throw new Error("School context required");
--
src/lib/actions/report-card-aggregation-actions.ts-14- * @returns Action result with report card data
src/lib/actions/report-card-aggregation-actions.ts-15- */
src/lib/actions/report-card-aggregation-actions.ts:16:export async function getReportCardData(studentId: string, termId: string) {
src/lib/actions/report-card-aggregation-actions.ts-17-  try {
src/lib/actions/report-card-aggregation-actions.ts-18-    // Add school isolation
src/lib/actions/report-card-aggregation-actions.ts-19-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/report-card-aggregation-actions.ts-20-    const schoolId = await getRequiredSchoolId();
src/lib/actions/report-card-aggregation-actions.ts-21-
--
src/lib/actions/report-card-aggregation-actions.ts-59- * @returns Action result with array of report card data
src/lib/actions/report-card-aggregation-actions.ts-60- */
src/lib/actions/report-card-aggregation-actions.ts:61:export async function getBatchReportCardData(studentIds: string[], termId: string) {
src/lib/actions/report-card-aggregation-actions.ts-62-  try {
src/lib/actions/report-card-aggregation-actions.ts-63-    // Add school isolation
src/lib/actions/report-card-aggregation-actions.ts-64-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/report-card-aggregation-actions.ts-65-    const schoolId = await getRequiredSchoolId();
src/lib/actions/report-card-aggregation-actions.ts-66-
--
src/lib/actions/report-card-aggregation-actions.ts-113- * @returns Action result with array of report card data
src/lib/actions/report-card-aggregation-actions.ts-114- */
src/lib/actions/report-card-aggregation-actions.ts:115:export async function getClassReportCardData(
src/lib/actions/report-card-aggregation-actions.ts-116-  classId: string,
src/lib/actions/report-card-aggregation-actions.ts-117-  termId: string,
src/lib/actions/report-card-aggregation-actions.ts-118-  sectionId?: string
src/lib/actions/report-card-aggregation-actions.ts-119-) {
src/lib/actions/report-card-aggregation-actions.ts-120-  try {
--
src/lib/actions/routeActions.ts-8-
src/lib/actions/routeActions.ts-9-// Get all routes with pagination and filters
src/lib/actions/routeActions.ts:10:export async function getRoutes(params?: {
src/lib/actions/routeActions.ts-11-  page?: number;
src/lib/actions/routeActions.ts-12-  limit?: number;
src/lib/actions/routeActions.ts-13-  search?: string;
src/lib/actions/routeActions.ts-14-  status?: string;
src/lib/actions/routeActions.ts-15-  vehicleId?: string;
--
src/lib/actions/routeActions.ts-85-
src/lib/actions/routeActions.ts-86-// Get a single route by ID
src/lib/actions/routeActions.ts:87:export async function getRouteById(id: string): Promise<RouteWithDetails> {
src/lib/actions/routeActions.ts-88-  try {
src/lib/actions/routeActions.ts-89-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-90-    
src/lib/actions/routeActions.ts-91-    if (!schoolId) {
src/lib/actions/routeActions.ts-92-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-138-
src/lib/actions/routeActions.ts-139-// Create a new route
src/lib/actions/routeActions.ts:140:export async function createRoute(data: RouteFormValues) {
src/lib/actions/routeActions.ts-141-  try {
src/lib/actions/routeActions.ts-142-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-143-    
src/lib/actions/routeActions.ts-144-    if (!schoolId) {
src/lib/actions/routeActions.ts-145-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-213-
src/lib/actions/routeActions.ts-214-// Update a route
src/lib/actions/routeActions.ts:215:export async function updateRoute(id: string, data: RouteUpdateFormValues) {
src/lib/actions/routeActions.ts-216-  try {
src/lib/actions/routeActions.ts-217-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-218-    
src/lib/actions/routeActions.ts-219-    if (!schoolId) {
src/lib/actions/routeActions.ts-220-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-318-
src/lib/actions/routeActions.ts-319-// Delete a route
src/lib/actions/routeActions.ts:320:export async function deleteRoute(id: string) {
src/lib/actions/routeActions.ts-321-  try {
src/lib/actions/routeActions.ts-322-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-323-    
src/lib/actions/routeActions.ts-324-    if (!schoolId) {
src/lib/actions/routeActions.ts-325-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-362-
src/lib/actions/routeActions.ts-363-// Get route statistics
src/lib/actions/routeActions.ts:364:export async function getRouteStats() {
src/lib/actions/routeActions.ts-365-  try {
src/lib/actions/routeActions.ts-366-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-367-    
src/lib/actions/routeActions.ts-368-    if (!schoolId) {
src/lib/actions/routeActions.ts-369-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-390-
src/lib/actions/routeActions.ts-391-// Get available vehicles for route assignment (vehicles not assigned to active routes)
src/lib/actions/routeActions.ts:392:export async function getAvailableVehicles() {
src/lib/actions/routeActions.ts-393-  try {
src/lib/actions/routeActions.ts-394-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-395-    
src/lib/actions/routeActions.ts-396-    if (!schoolId) {
src/lib/actions/routeActions.ts-397-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-424-
src/lib/actions/routeActions.ts-425-// Assign a student to a route
src/lib/actions/routeActions.ts:426:export async function assignStudentToRoute(data: StudentRouteFormValues) {
src/lib/actions/routeActions.ts-427-  try {
src/lib/actions/routeActions.ts-428-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-429-    
src/lib/actions/routeActions.ts-430-    if (!schoolId) {
src/lib/actions/routeActions.ts-431-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-527-
src/lib/actions/routeActions.ts-528-// Unassign a student from a route
src/lib/actions/routeActions.ts:529:export async function unassignStudentFromRoute(studentRouteId: string) {
src/lib/actions/routeActions.ts-530-  try {
src/lib/actions/routeActions.ts-531-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-532-    
src/lib/actions/routeActions.ts-533-    if (!schoolId) {
src/lib/actions/routeActions.ts-534-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-564-
src/lib/actions/routeActions.ts-565-// Update student route assignment (change pickup/drop stops)
src/lib/actions/routeActions.ts:566:export async function updateStudentRouteAssignment(
src/lib/actions/routeActions.ts-567-  studentRouteId: string,
src/lib/actions/routeActions.ts-568-  data: { pickupStop?: string; dropStop?: string }
src/lib/actions/routeActions.ts-569-) {
src/lib/actions/routeActions.ts-570-  try {
src/lib/actions/routeActions.ts-571-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/routeActions.ts-630-
src/lib/actions/routeActions.ts-631-// Get students available for route assignment (not already assigned to this route)
src/lib/actions/routeActions.ts:632:export async function getAvailableStudentsForRoute(routeId: string, search?: string) {
src/lib/actions/routeActions.ts-633-  try {
src/lib/actions/routeActions.ts-634-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/routeActions.ts-635-    
src/lib/actions/routeActions.ts-636-    if (!schoolId) {
src/lib/actions/routeActions.ts-637-      throw new Error("School context required");
--
src/lib/actions/routeActions.ts-713-
src/lib/actions/routeActions.ts-714-// Calculate transport fee for a student based on route
src/lib/actions/routeActions.ts:715:export async function calculateTransportFee(routeId: string) {
src/lib/actions/routeActions.ts-716-  try {
src/lib/actions/routeActions.ts-717-    const route = await db.route.findUnique({
src/lib/actions/routeActions.ts-718-      where: { id: routeId },
src/lib/actions/routeActions.ts-719-      select: { fee: true },
src/lib/actions/routeActions.ts-720-    });
--
src/lib/actions/gradeCalculationActions.ts-16- * Returns all grade scales sorted by maxMarks descending
src/lib/actions/gradeCalculationActions.ts-17- */
src/lib/actions/gradeCalculationActions.ts:18:export async function getGradeScale(): Promise<ActionResult> {
src/lib/actions/gradeCalculationActions.ts-19-  try {
src/lib/actions/gradeCalculationActions.ts-20-    // CRITICAL: Add school isolation
src/lib/actions/gradeCalculationActions.ts-21-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/gradeCalculationActions.ts-22-    const schoolId = await getRequiredSchoolId();
src/lib/actions/gradeCalculationActions.ts-23-
--
src/lib/actions/gradeCalculationActions.ts-55- * @returns Grade string or null if calculation fails
src/lib/actions/gradeCalculationActions.ts-56- */
src/lib/actions/gradeCalculationActions.ts:57:export async function calculateGradeForMarks(
src/lib/actions/gradeCalculationActions.ts-58-  obtainedMarks: number,
src/lib/actions/gradeCalculationActions.ts-59-  totalMarks: number
src/lib/actions/gradeCalculationActions.ts-60-): Promise<ActionResult<{ grade: string; percentage: number }>> {
src/lib/actions/gradeCalculationActions.ts-61-  try {
src/lib/actions/gradeCalculationActions.ts-62-    // Calculate percentage
--
src/lib/actions/gradeCalculationActions.ts-108- * This is useful when grade scale is updated
src/lib/actions/gradeCalculationActions.ts-109- */
src/lib/actions/gradeCalculationActions.ts:110:export async function recalculateGradesForTerm(termId: string): Promise<ActionResult> {
src/lib/actions/gradeCalculationActions.ts-111-  try {
src/lib/actions/gradeCalculationActions.ts-112-    // CRITICAL: Add school isolation
src/lib/actions/gradeCalculationActions.ts-113-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/gradeCalculationActions.ts-114-    const schoolId = await getRequiredSchoolId();
src/lib/actions/gradeCalculationActions.ts-115-
--
src/lib/actions/gradeCalculationActions.ts-202- * Recalculate grades for a specific exam
src/lib/actions/gradeCalculationActions.ts-203- */
src/lib/actions/gradeCalculationActions.ts:204:export async function recalculateGradesForExam(examId: string): Promise<ActionResult> {
src/lib/actions/gradeCalculationActions.ts-205-  try {
src/lib/actions/gradeCalculationActions.ts-206-    // CRITICAL: Add school isolation
src/lib/actions/gradeCalculationActions.ts-207-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/gradeCalculationActions.ts-208-    const schoolId = await getRequiredSchoolId();
src/lib/actions/gradeCalculationActions.ts-209-
--
src/lib/actions/sectionsActions.ts-26-
src/lib/actions/sectionsActions.ts-27-// Get all sections with related info
src/lib/actions/sectionsActions.ts:28:export async function getSections(classFilter?: string) {
src/lib/actions/sectionsActions.ts-29-  try {
src/lib/actions/sectionsActions.ts-30-    const where = classFilter ? { classId: classFilter } : {};
src/lib/actions/sectionsActions.ts-31-
src/lib/actions/sectionsActions.ts-32-    const sections = await db.classSection.findMany({
src/lib/actions/sectionsActions.ts-33-      where,
--
src/lib/actions/sectionsActions.ts-140-
src/lib/actions/sectionsActions.ts-141-// Get a single section by ID
src/lib/actions/sectionsActions.ts:142:export async function getSectionById(id: string) {
src/lib/actions/sectionsActions.ts-143-  try {
src/lib/actions/sectionsActions.ts-144-    const section = await db.classSection.findUnique({
src/lib/actions/sectionsActions.ts-145-      where: { id },
src/lib/actions/sectionsActions.ts-146-      include: {
src/lib/actions/sectionsActions.ts-147-        class: {
--
src/lib/actions/sectionsActions.ts-230-
src/lib/actions/sectionsActions.ts-231-// Get all classes for dropdown
src/lib/actions/sectionsActions.ts:232:export async function getClassesForDropdown() {
src/lib/actions/sectionsActions.ts-233-  try {
src/lib/actions/sectionsActions.ts-234-    const classes = await db.class.findMany({
src/lib/actions/sectionsActions.ts-235-      orderBy: [
src/lib/actions/sectionsActions.ts-236-        { academicYear: { startDate: 'desc' } },
src/lib/actions/sectionsActions.ts-237-        { name: 'asc' },
--
src/lib/actions/sectionsActions.ts-258-
src/lib/actions/sectionsActions.ts-259-// Get all teachers for dropdown
src/lib/actions/sectionsActions.ts:260:export async function getTeachersForDropdown() {
src/lib/actions/sectionsActions.ts-261-  try {
src/lib/actions/sectionsActions.ts-262-    const teachers = await db.teacher.findMany({
src/lib/actions/sectionsActions.ts-263-      include: {
src/lib/actions/sectionsActions.ts-264-        user: {
src/lib/actions/sectionsActions.ts-265-          select: {
--
src/lib/actions/sectionsActions.ts-293-
src/lib/actions/sectionsActions.ts-294-// Get all classrooms for dropdown
src/lib/actions/sectionsActions.ts:295:export async function getClassRoomsForDropdown() {
src/lib/actions/sectionsActions.ts-296-  try {
src/lib/actions/sectionsActions.ts-297-    const rooms = await db.classRoom.findMany({
src/lib/actions/sectionsActions.ts-298-      orderBy: {
src/lib/actions/sectionsActions.ts-299-        name: 'asc',
src/lib/actions/sectionsActions.ts-300-      }
--
src/lib/actions/sectionsActions.ts-312-
src/lib/actions/sectionsActions.ts-313-// Create a new section
src/lib/actions/sectionsActions.ts:314:export async function createSection(data: SectionFormValues) {
src/lib/actions/sectionsActions.ts-315-  try {
src/lib/actions/sectionsActions.ts-316-    // Permission check: require SECTION:CREATE
src/lib/actions/sectionsActions.ts-317-    await checkPermission('SECTION', 'CREATE', 'You do not have permission to create sections');
src/lib/actions/sectionsActions.ts-318-
src/lib/actions/sectionsActions.ts-319-    // Get required school context
--
src/lib/actions/sectionsActions.ts-395-
src/lib/actions/sectionsActions.ts-396-// Update an existing section
src/lib/actions/sectionsActions.ts:397:export async function updateSection(data: SectionUpdateFormValues) {
src/lib/actions/sectionsActions.ts-398-  try {
src/lib/actions/sectionsActions.ts-399-    // Permission check: require SECTION:UPDATE
src/lib/actions/sectionsActions.ts-400-    await checkPermission('SECTION', 'UPDATE', 'You do not have permission to update sections');
src/lib/actions/sectionsActions.ts-401-
src/lib/actions/sectionsActions.ts-402-    // Get required school context
--
src/lib/actions/sectionsActions.ts-480-
src/lib/actions/sectionsActions.ts-481-// Delete a section
src/lib/actions/sectionsActions.ts:482:export async function deleteSection(id: string) {
src/lib/actions/sectionsActions.ts-483-  try {
src/lib/actions/sectionsActions.ts-484-    // Check if section has enrollments
src/lib/actions/sectionsActions.ts-485-    const enrollments = await db.classEnrollment.findFirst({
src/lib/actions/sectionsActions.ts-486-      where: { sectionId: id }
src/lib/actions/sectionsActions.ts-487-    });
--
src/lib/actions/onboarding-progress-actions.ts-15- * Get detailed onboarding progress for a specific school
src/lib/actions/onboarding-progress-actions.ts-16- */
src/lib/actions/onboarding-progress-actions.ts:17:export async function getSchoolOnboardingProgress(schoolId: string) {
src/lib/actions/onboarding-progress-actions.ts-18-  await requireSuperAdminAccess();
src/lib/actions/onboarding-progress-actions.ts-19-
src/lib/actions/onboarding-progress-actions.ts-20-  try {
src/lib/actions/onboarding-progress-actions.ts-21-    const progress = await OnboardingProgressService.getSchoolProgress(schoolId);
src/lib/actions/onboarding-progress-actions.ts-22-    
--
src/lib/actions/onboarding-progress-actions.ts-44- * Get onboarding progress for the current school (for school admins)
src/lib/actions/onboarding-progress-actions.ts-45- */
src/lib/actions/onboarding-progress-actions.ts:46:export async function getCurrentSchoolOnboardingProgress() {
src/lib/actions/onboarding-progress-actions.ts-47-  try {
src/lib/actions/onboarding-progress-actions.ts-48-    const schoolId = await getCurrentSchoolId();
src/lib/actions/onboarding-progress-actions.ts-49-    
src/lib/actions/onboarding-progress-actions.ts-50-    if (!schoolId) {
src/lib/actions/onboarding-progress-actions.ts-51-      return {
--
src/lib/actions/onboarding-progress-actions.ts-82- * Update progress for a specific onboarding step
src/lib/actions/onboarding-progress-actions.ts-83- */
src/lib/actions/onboarding-progress-actions.ts:84:export async function updateOnboardingStepProgress(
src/lib/actions/onboarding-progress-actions.ts-85-  step: number,
src/lib/actions/onboarding-progress-actions.ts-86-  status: OnboardingStepProgress['status'],
src/lib/actions/onboarding-progress-actions.ts-87-  metadata?: Record<string, any>,
src/lib/actions/onboarding-progress-actions.ts-88-  errorMessage?: string
src/lib/actions/onboarding-progress-actions.ts-89-) {
--
src/lib/actions/onboarding-progress-actions.ts-128- * Reset onboarding progress for a school (Super Admin only)
src/lib/actions/onboarding-progress-actions.ts-129- */
src/lib/actions/onboarding-progress-actions.ts:130:export async function resetSchoolOnboardingProgress(schoolId: string) {
src/lib/actions/onboarding-progress-actions.ts-131-  await requireSuperAdminAccess();
src/lib/actions/onboarding-progress-actions.ts-132-
src/lib/actions/onboarding-progress-actions.ts-133-  try {
src/lib/actions/onboarding-progress-actions.ts-134-    const progress = await OnboardingProgressService.resetSchoolProgress(schoolId);
src/lib/actions/onboarding-progress-actions.ts-135-
--
src/lib/actions/onboarding-progress-actions.ts-156- * Get onboarding progress summary for multiple schools (Super Admin only)
src/lib/actions/onboarding-progress-actions.ts-157- */
src/lib/actions/onboarding-progress-actions.ts:158:export async function getSchoolsOnboardingProgressSummary(schoolIds: string[]) {
src/lib/actions/onboarding-progress-actions.ts-159-  await requireSuperAdminAccess();
src/lib/actions/onboarding-progress-actions.ts-160-
src/lib/actions/onboarding-progress-actions.ts-161-  try {
src/lib/actions/onboarding-progress-actions.ts-162-    const summaries = await OnboardingProgressService.getSchoolsProgressSummary(schoolIds);
src/lib/actions/onboarding-progress-actions.ts-163-
--
src/lib/actions/onboarding-progress-actions.ts-178- * Get comprehensive onboarding analytics (Super Admin only)
src/lib/actions/onboarding-progress-actions.ts-179- */
src/lib/actions/onboarding-progress-actions.ts:180:export async function getOnboardingAnalytics() {
src/lib/actions/onboarding-progress-actions.ts-181-  await requireSuperAdminAccess();
src/lib/actions/onboarding-progress-actions.ts-182-
src/lib/actions/onboarding-progress-actions.ts-183-  try {
src/lib/actions/onboarding-progress-actions.ts-184-    const analytics = await OnboardingProgressService.getOnboardingAnalytics();
src/lib/actions/onboarding-progress-actions.ts-185-
--
src/lib/actions/onboarding-progress-actions.ts-200- * Initialize onboarding progress for a school (Super Admin only)
src/lib/actions/onboarding-progress-actions.ts-201- */
src/lib/actions/onboarding-progress-actions.ts:202:export async function initializeSchoolOnboardingProgress(schoolId: string, assignedTo?: string) {
src/lib/actions/onboarding-progress-actions.ts-203-  await requireSuperAdminAccess();
src/lib/actions/onboarding-progress-actions.ts-204-
src/lib/actions/onboarding-progress-actions.ts-205-  try {
src/lib/actions/onboarding-progress-actions.ts-206-    const progress = await OnboardingProgressService.initializeSchoolProgress(schoolId, assignedTo);
src/lib/actions/onboarding-progress-actions.ts-207-
--
src/lib/actions/onboarding-progress-actions.ts-228- * Bulk reset onboarding progress for multiple schools (Super Admin only)
src/lib/actions/onboarding-progress-actions.ts-229- */
src/lib/actions/onboarding-progress-actions.ts:230:export async function bulkResetOnboardingProgress(schoolIds: string[]) {
src/lib/actions/onboarding-progress-actions.ts-231-  await requireSuperAdminAccess();
src/lib/actions/onboarding-progress-actions.ts-232-
src/lib/actions/onboarding-progress-actions.ts-233-  try {
src/lib/actions/onboarding-progress-actions.ts-234-    const results = [];
src/lib/actions/onboarding-progress-actions.ts-235-    
--
src/lib/actions/onboarding-progress-actions.ts-276- * Mark a specific step as completed with metadata
src/lib/actions/onboarding-progress-actions.ts-277- */
src/lib/actions/onboarding-progress-actions.ts:278:export async function completeOnboardingStep(
src/lib/actions/onboarding-progress-actions.ts-279-  step: number,
src/lib/actions/onboarding-progress-actions.ts-280-  metadata?: Record<string, any>
src/lib/actions/onboarding-progress-actions.ts-281-) {
src/lib/actions/onboarding-progress-actions.ts-282-  return updateOnboardingStepProgress(step, 'completed', metadata);
src/lib/actions/onboarding-progress-actions.ts-283-}
--
src/lib/actions/onboarding-progress-actions.ts-286- * Mark a specific step as failed with error message
src/lib/actions/onboarding-progress-actions.ts-287- */
src/lib/actions/onboarding-progress-actions.ts:288:export async function failOnboardingStep(
src/lib/actions/onboarding-progress-actions.ts-289-  step: number,
src/lib/actions/onboarding-progress-actions.ts-290-  errorMessage: string,
src/lib/actions/onboarding-progress-actions.ts-291-  metadata?: Record<string, any>
src/lib/actions/onboarding-progress-actions.ts-292-) {
src/lib/actions/onboarding-progress-actions.ts-293-  return updateOnboardingStepProgress(step, 'failed', metadata, errorMessage);
--
src/lib/actions/onboarding-progress-actions.ts-297- * Start a specific onboarding step
src/lib/actions/onboarding-progress-actions.ts-298- */
src/lib/actions/onboarding-progress-actions.ts:299:export async function startOnboardingStep(
src/lib/actions/onboarding-progress-actions.ts-300-  step: number,
src/lib/actions/onboarding-progress-actions.ts-301-  metadata?: Record<string, any>
src/lib/actions/onboarding-progress-actions.ts-302-) {
src/lib/actions/onboarding-progress-actions.ts-303-  return updateOnboardingStepProgress(step, 'in_progress', metadata);
src/lib/actions/onboarding-progress-actions.ts-304-}
--
src/lib/actions/onboarding-progress-actions.ts-307- * Skip a specific onboarding step (if not required)
src/lib/actions/onboarding-progress-actions.ts-308- */
src/lib/actions/onboarding-progress-actions.ts:309:export async function skipOnboardingStep(
src/lib/actions/onboarding-progress-actions.ts-310-  step: number,
src/lib/actions/onboarding-progress-actions.ts-311-  reason?: string
src/lib/actions/onboarding-progress-actions.ts-312-) {
src/lib/actions/onboarding-progress-actions.ts-313-  const metadata = reason ? { skipReason: reason } : undefined;
src/lib/actions/onboarding-progress-actions.ts-314-  return updateOnboardingStepProgress(step, 'skipped', metadata);
--
src/lib/actions/student-fee-actions.ts-159- * Get student fee details
src/lib/actions/student-fee-actions.ts-160- */
src/lib/actions/student-fee-actions.ts:161:export async function getStudentFeeDetails() {
src/lib/actions/student-fee-actions.ts-162-  const student = await getCurrentStudent();
src/lib/actions/student-fee-actions.ts-163-
src/lib/actions/student-fee-actions.ts-164-  if (!student) {
src/lib/actions/student-fee-actions.ts-165-    redirect("/login");
src/lib/actions/student-fee-actions.ts-166-  }
--
src/lib/actions/student-fee-actions.ts-309- * Get fee payment history
src/lib/actions/student-fee-actions.ts-310- */
src/lib/actions/student-fee-actions.ts:311:export async function getFeePaymentHistory() {
src/lib/actions/student-fee-actions.ts-312-  const student = await getCurrentStudent();
src/lib/actions/student-fee-actions.ts-313-
src/lib/actions/student-fee-actions.ts-314-  if (!student) {
src/lib/actions/student-fee-actions.ts-315-    redirect("/login");
src/lib/actions/student-fee-actions.ts-316-  }
--
src/lib/actions/student-fee-actions.ts-342- * Get due payments
src/lib/actions/student-fee-actions.ts-343- */
src/lib/actions/student-fee-actions.ts:344:export async function getDuePayments() {
src/lib/actions/student-fee-actions.ts-345-  const student = await getCurrentStudent();
src/lib/actions/student-fee-actions.ts-346-
src/lib/actions/student-fee-actions.ts-347-  if (!student) {
src/lib/actions/student-fee-actions.ts-348-    redirect("/login");
src/lib/actions/student-fee-actions.ts-349-  }
--
src/lib/actions/student-fee-actions.ts-460- * Requirements: 10.1, 10.2
src/lib/actions/student-fee-actions.ts-461- */
src/lib/actions/student-fee-actions.ts:462:export async function makePayment(feeItemId: string, paymentData: z.infer<typeof paymentSchema> & { csrfToken?: string }) {
src/lib/actions/student-fee-actions.ts-463-  const student = await getCurrentStudent();
src/lib/actions/student-fee-actions.ts-464-
src/lib/actions/student-fee-actions.ts-465-  if (!student) {
src/lib/actions/student-fee-actions.ts-466-    return { success: false, message: "Authentication required" };
src/lib/actions/student-fee-actions.ts-467-  }
--
src/lib/actions/student-fee-actions.ts-580- * Get student scholarship info
src/lib/actions/student-fee-actions.ts-581- */
src/lib/actions/student-fee-actions.ts:582:export async function getStudentScholarships() {
src/lib/actions/student-fee-actions.ts-583-  const student = await getCurrentStudent();
src/lib/actions/student-fee-actions.ts-584-
src/lib/actions/student-fee-actions.ts-585-  if (!student) {
src/lib/actions/student-fee-actions.ts-586-    redirect("/login");
src/lib/actions/student-fee-actions.ts-587-  }
--
src/lib/actions/student-fee-actions.ts-621- * Apply for scholarship
src/lib/actions/student-fee-actions.ts-622- */
src/lib/actions/student-fee-actions.ts:623:export async function applyForScholarship(scholarshipId: string) {
src/lib/actions/student-fee-actions.ts-624-  const student = await getCurrentStudent();
src/lib/actions/student-fee-actions.ts-625-
src/lib/actions/student-fee-actions.ts-626-  if (!student) {
src/lib/actions/student-fee-actions.ts-627-    return { success: false, message: "Authentication required" };
src/lib/actions/student-fee-actions.ts-628-  }
--
src/lib/actions/assessmentRulesActions.ts-19-}
src/lib/actions/assessmentRulesActions.ts-20-
src/lib/actions/assessmentRulesActions.ts:21:export async function getAssessmentRules() {
src/lib/actions/assessmentRulesActions.ts-22-    try {
src/lib/actions/assessmentRulesActions.ts-23-        await checkPermission("VIEW");
src/lib/actions/assessmentRulesActions.ts-24-        const rules = await db.assessmentRule.findMany({
src/lib/actions/assessmentRulesActions.ts-25-            include: {
src/lib/actions/assessmentRulesActions.ts-26-                class: true,
--
src/lib/actions/assessmentRulesActions.ts-34-}
src/lib/actions/assessmentRulesActions.ts-35-
src/lib/actions/assessmentRulesActions.ts:36:export async function createAssessmentRule(data: AssessmentRuleFormValues) {
src/lib/actions/assessmentRulesActions.ts-37-    try {
src/lib/actions/assessmentRulesActions.ts-38-        await checkPermission("CREATE");
src/lib/actions/assessmentRulesActions.ts-39-        const { schoolId } = await requireSchoolAccess();
src/lib/actions/assessmentRulesActions.ts-40-        if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assessmentRulesActions.ts-41-        
--
src/lib/actions/assessmentRulesActions.ts-59-}
src/lib/actions/assessmentRulesActions.ts-60-
src/lib/actions/assessmentRulesActions.ts:61:export async function updateAssessmentRule(data: AssessmentRuleUpdateFormValues) {
src/lib/actions/assessmentRulesActions.ts-62-    try {
src/lib/actions/assessmentRulesActions.ts-63-        await checkPermission("UPDATE");
src/lib/actions/assessmentRulesActions.ts-64-        const rule = await db.assessmentRule.update({
src/lib/actions/assessmentRulesActions.ts-65-            where: { id: data.id },
src/lib/actions/assessmentRulesActions.ts-66-            data: {
--
src/lib/actions/assessmentRulesActions.ts-81-}
src/lib/actions/assessmentRulesActions.ts-82-
src/lib/actions/assessmentRulesActions.ts:83:export async function deleteAssessmentRule(id: string) {
src/lib/actions/assessmentRulesActions.ts-84-    try {
src/lib/actions/assessmentRulesActions.ts-85-        await checkPermission("DELETE");
src/lib/actions/assessmentRulesActions.ts-86-        await db.assessmentRule.delete({ where: { id } });
src/lib/actions/assessmentRulesActions.ts-87-        revalidatePath("/admin/assessment/assessment-rules");
src/lib/actions/assessmentRulesActions.ts-88-        return { success: true };
--
src/lib/actions/feePaymentActions.ts-29-
src/lib/actions/feePaymentActions.ts-30-// Get all fee payments with filters
src/lib/actions/feePaymentActions.ts:31:export async function getFeePayments(filters?: {
src/lib/actions/feePaymentActions.ts-32-  studentId?: string;
src/lib/actions/feePaymentActions.ts-33-  status?: PaymentStatus;
src/lib/actions/feePaymentActions.ts-34-  dateFrom?: Date;
src/lib/actions/feePaymentActions.ts-35-  dateTo?: Date;
src/lib/actions/feePaymentActions.ts-36-  limit?: number;
--
src/lib/actions/feePaymentActions.ts-115-
src/lib/actions/feePaymentActions.ts-116-// Get single payment by ID
src/lib/actions/feePaymentActions.ts:117:export async function getFeePaymentById(id: string) {
src/lib/actions/feePaymentActions.ts-118-  try {
src/lib/actions/feePaymentActions.ts-119-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/feePaymentActions.ts-120-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/feePaymentActions.ts-121-
src/lib/actions/feePaymentActions.ts-122-    const payment = await db.feePayment.findFirst({
--
src/lib/actions/feePaymentActions.ts-169-
src/lib/actions/feePaymentActions.ts-170-// Record new payment
src/lib/actions/feePaymentActions.ts:171:export async function recordPayment(data: any) {
src/lib/actions/feePaymentActions.ts-172-  try {
src/lib/actions/feePaymentActions.ts-173-    // Permission check: require PAYMENT:CREATE
src/lib/actions/feePaymentActions.ts-174-    await checkPermission('PAYMENT', 'CREATE', 'You do not have permission to record payments');
src/lib/actions/feePaymentActions.ts-175-
src/lib/actions/feePaymentActions.ts-176-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/feePaymentActions.ts-252-
src/lib/actions/feePaymentActions.ts-253-// Update existing payment
src/lib/actions/feePaymentActions.ts:254:export async function updatePayment(id: string, data: any) {
src/lib/actions/feePaymentActions.ts-255-  try {
src/lib/actions/feePaymentActions.ts-256-    // Permission check: require PAYMENT:UPDATE
src/lib/actions/feePaymentActions.ts-257-    await checkPermission('PAYMENT', 'UPDATE', 'You do not have permission to update payments');
src/lib/actions/feePaymentActions.ts-258-
src/lib/actions/feePaymentActions.ts-259-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/feePaymentActions.ts-306-
src/lib/actions/feePaymentActions.ts-307-// Delete payment
src/lib/actions/feePaymentActions.ts:308:export async function deletePayment(id: string) {
src/lib/actions/feePaymentActions.ts-309-  try {
src/lib/actions/feePaymentActions.ts-310-    // Permission check: require PAYMENT:DELETE
src/lib/actions/feePaymentActions.ts-311-    await checkPermission('PAYMENT', 'DELETE', 'You do not have permission to delete payments');
src/lib/actions/feePaymentActions.ts-312-
src/lib/actions/feePaymentActions.ts-313-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/feePaymentActions.ts-341-
src/lib/actions/feePaymentActions.ts-342-// Get pending fees for students
src/lib/actions/feePaymentActions.ts:343:export async function getPendingFees(filters?: {
src/lib/actions/feePaymentActions.ts-344-  studentId?: string;
src/lib/actions/feePaymentActions.ts-345-  classId?: string;
src/lib/actions/feePaymentActions.ts-346-  limit?: number;
src/lib/actions/feePaymentActions.ts-347-}) {
src/lib/actions/feePaymentActions.ts-348-  try {
--
src/lib/actions/feePaymentActions.ts-462-
src/lib/actions/feePaymentActions.ts-463-// Get payment statistics
src/lib/actions/feePaymentActions.ts:464:export async function getPaymentStats(filters?: {
src/lib/actions/feePaymentActions.ts-465-  academicYearId?: string;
src/lib/actions/feePaymentActions.ts-466-  dateFrom?: Date;
src/lib/actions/feePaymentActions.ts-467-  dateTo?: Date;
src/lib/actions/feePaymentActions.ts-468-}) {
src/lib/actions/feePaymentActions.ts-469-  try {
--
src/lib/actions/feePaymentActions.ts-545-
src/lib/actions/feePaymentActions.ts-546-// Get students for dropdown (for payment form)
src/lib/actions/feePaymentActions.ts:547:export async function getStudentsForPayment() {
src/lib/actions/feePaymentActions.ts-548-  try {
src/lib/actions/feePaymentActions.ts-549-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/feePaymentActions.ts-550-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/feePaymentActions.ts-551-
src/lib/actions/feePaymentActions.ts-552-    const students = await db.student.findMany({
--
src/lib/actions/feePaymentActions.ts-593-
src/lib/actions/feePaymentActions.ts-594-// Get fee structures for a student
src/lib/actions/feePaymentActions.ts:595:export async function getFeeStructuresForStudent(studentId: string) {
src/lib/actions/feePaymentActions.ts-596-  try {
src/lib/actions/feePaymentActions.ts-597-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/feePaymentActions.ts-598-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/feePaymentActions.ts-599-
src/lib/actions/feePaymentActions.ts-600-    const student = await db.student.findFirst({
--
src/lib/actions/feePaymentActions.ts-649-
src/lib/actions/feePaymentActions.ts-650-// Generate receipt number
src/lib/actions/feePaymentActions.ts:651:export async function generateReceiptNumber() {
src/lib/actions/feePaymentActions.ts-652-  try {
src/lib/actions/feePaymentActions.ts-653-    const year = new Date().getFullYear();
src/lib/actions/feePaymentActions.ts-654-    const month = String(new Date().getMonth() + 1).padStart(2, "0");
src/lib/actions/feePaymentActions.ts-655-
src/lib/actions/feePaymentActions.ts-656-    // Get count of payments this month
--
src/lib/actions/feePaymentActions.ts-683-
src/lib/actions/feePaymentActions.ts-684-// Get payment receipt HTML for printing
src/lib/actions/feePaymentActions.ts:685:export async function getPaymentReceiptHTML(paymentId: string) {
src/lib/actions/feePaymentActions.ts-686-  try {
src/lib/actions/feePaymentActions.ts-687-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/feePaymentActions.ts-688-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/feePaymentActions.ts-689-
src/lib/actions/feePaymentActions.ts-690-    const payment = await db.feePayment.findFirst({
--
src/lib/actions/feePaymentActions.ts-792- * Groups multiple fee payments into a single receipt
src/lib/actions/feePaymentActions.ts-793- */
src/lib/actions/feePaymentActions.ts:794:export async function getConsolidatedReceiptHTML(
src/lib/actions/feePaymentActions.ts-795-  studentId: string,
src/lib/actions/feePaymentActions.ts-796-  paymentDate: Date
src/lib/actions/feePaymentActions.ts-797-) {
src/lib/actions/feePaymentActions.ts-798-  try {
src/lib/actions/feePaymentActions.ts-799-    // Get start and end of the day for date comparison
--
src/lib/actions/feePaymentActions.ts-944-// Send fee reminders for due and overdue payments
src/lib/actions/feePaymentActions.ts-945-// Requirements: 7.1, 7.2, 7.4, 7.5
src/lib/actions/feePaymentActions.ts:946:export async function sendFeeReminders() {
src/lib/actions/feePaymentActions.ts-947-  try {
src/lib/actions/feePaymentActions.ts-948-    const today = new Date();
src/lib/actions/feePaymentActions.ts-949-    today.setHours(0, 0, 0, 0);
src/lib/actions/feePaymentActions.ts-950-
src/lib/actions/feePaymentActions.ts-951-    // Get all pending and partial payments
--
src/lib/actions/feePaymentActions.ts-1025-// Send overdue fee alerts
src/lib/actions/feePaymentActions.ts-1026-// Requirements: 7.2, 7.4, 7.5
src/lib/actions/feePaymentActions.ts:1027:export async function sendOverdueFeeAlerts() {
src/lib/actions/feePaymentActions.ts-1028-  try {
src/lib/actions/feePaymentActions.ts-1029-    const today = new Date();
src/lib/actions/feePaymentActions.ts-1030-    today.setHours(0, 0, 0, 0);
src/lib/actions/feePaymentActions.ts-1031-
src/lib/actions/feePaymentActions.ts-1032-    // Get all overdue payments
--
src/lib/actions/resultsActions.ts-8-
src/lib/actions/resultsActions.ts-9-// Get all exam results with optional filtering
src/lib/actions/resultsActions.ts:10:export async function getExamResults(filters?: ResultFilterValues) {
src/lib/actions/resultsActions.ts-11-  try {
src/lib/actions/resultsActions.ts-12-    const session = await auth();
src/lib/actions/resultsActions.ts-13-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/resultsActions.ts-14-    
src/lib/actions/resultsActions.ts-15-    // Get required school context
--
src/lib/actions/resultsActions.ts-156-
src/lib/actions/resultsActions.ts-157-// Get results for a specific exam
src/lib/actions/resultsActions.ts:158:export async function getExamResultById(examId: string) {
src/lib/actions/resultsActions.ts-159-  try {
src/lib/actions/resultsActions.ts-160-    const session = await auth();
src/lib/actions/resultsActions.ts-161-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/resultsActions.ts-162-    
src/lib/actions/resultsActions.ts-163-    // Get required school context
--
src/lib/actions/resultsActions.ts-287-
src/lib/actions/resultsActions.ts-288-// Get student results (across exams)
src/lib/actions/resultsActions.ts:289:export async function getStudentResults(studentId: string, termId?: string) {
src/lib/actions/resultsActions.ts-290-  try {
src/lib/actions/resultsActions.ts-291-    const session = await auth();
src/lib/actions/resultsActions.ts-292-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/resultsActions.ts-293-    
src/lib/actions/resultsActions.ts-294-    // Get required school context
--
src/lib/actions/resultsActions.ts-478-
src/lib/actions/resultsActions.ts-479-// Publish exam results
src/lib/actions/resultsActions.ts:480:export async function publishExamResults(data: PublishResultsValues) {
src/lib/actions/resultsActions.ts-481-  try {
src/lib/actions/resultsActions.ts-482-    const session = await auth();
src/lib/actions/resultsActions.ts-483-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/resultsActions.ts-484-    // In a real implementation, this might update a 'isPublished' field on the exam
src/lib/actions/resultsActions.ts-485-    // or create notifications for students
--
src/lib/actions/resultsActions.ts-503-
src/lib/actions/resultsActions.ts-504-// Generate report card
src/lib/actions/resultsActions.ts:505:export async function generateReportCard(data: GenerateReportCardValues) {
src/lib/actions/resultsActions.ts-506-  try {
src/lib/actions/resultsActions.ts-507-    const session = await auth();
src/lib/actions/resultsActions.ts-508-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/resultsActions.ts-509-    
src/lib/actions/resultsActions.ts-510-    // Get required school context
--
src/lib/actions/resultsActions.ts-601-
src/lib/actions/resultsActions.ts-602-// Get available exam filters (subjects, grades, exam types)
src/lib/actions/resultsActions.ts:603:export async function getResultFilters() {
src/lib/actions/resultsActions.ts-604-  try {
src/lib/actions/resultsActions.ts-605-    const session = await auth();
src/lib/actions/resultsActions.ts-606-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/resultsActions.ts-607-    
src/lib/actions/resultsActions.ts-608-    // Get required school context
--
src/lib/actions/audit-log-actions.ts-65- * Get audit logs with filtering, pagination, and user information
src/lib/actions/audit-log-actions.ts-66- */
src/lib/actions/audit-log-actions.ts:67:export async function getAuditLogs(params: GetAuditLogsParams = {}): Promise<{
src/lib/actions/audit-log-actions.ts-68-    success: boolean;
src/lib/actions/audit-log-actions.ts-69-    data?: AuditLogWithUser[];
src/lib/actions/audit-log-actions.ts-70-    total?: number;
src/lib/actions/audit-log-actions.ts-71-    error?: string;
src/lib/actions/audit-log-actions.ts-72-}> {
--
src/lib/actions/audit-log-actions.ts-202- * Get audit log statistics
src/lib/actions/audit-log-actions.ts-203- */
src/lib/actions/audit-log-actions.ts:204:export async function getAuditLogStats(params: {
src/lib/actions/audit-log-actions.ts-205-    schoolId?: string;
src/lib/actions/audit-log-actions.ts-206-    dateFrom?: Date;
src/lib/actions/audit-log-actions.ts-207-    dateTo?: Date;
src/lib/actions/audit-log-actions.ts-208-} = {}): Promise<{
src/lib/actions/audit-log-actions.ts-209-    success: boolean;
--
src/lib/actions/audit-log-actions.ts-281- * Get recent audit logs for dashboard (limited to 5)
src/lib/actions/audit-log-actions.ts-282- */
src/lib/actions/audit-log-actions.ts:283:export async function getRecentAuditLogs(limit: number = 5): Promise<{
src/lib/actions/audit-log-actions.ts-284-    success: boolean;
src/lib/actions/audit-log-actions.ts-285-    data?: Array<{
src/lib/actions/audit-log-actions.ts-286-        id: string;
src/lib/actions/audit-log-actions.ts-287-        action: string;
src/lib/actions/audit-log-actions.ts-288-        entityType: string;
--
src/lib/actions/audit-log-actions.ts-339- * Export audit logs (for CSV/JSON download)
src/lib/actions/audit-log-actions.ts-340- */
src/lib/actions/audit-log-actions.ts:341:export async function exportAuditLogs(params: GetAuditLogsParams & { format: "json" | "csv" }): Promise<{
src/lib/actions/audit-log-actions.ts-342-    success: boolean;
src/lib/actions/audit-log-actions.ts-343-    data?: string;
src/lib/actions/audit-log-actions.ts-344-    error?: string;
src/lib/actions/audit-log-actions.ts-345-}> {
src/lib/actions/audit-log-actions.ts-346-    try {
--
src/lib/actions/two-factor-actions.ts-30- * Returns QR code and secret for authenticator app setup
src/lib/actions/two-factor-actions.ts-31- */
src/lib/actions/two-factor-actions.ts:32:export async function initiateTwoFactorSetup(): Promise<TwoFactorSetupResult> {
src/lib/actions/two-factor-actions.ts-33-  try {
src/lib/actions/two-factor-actions.ts-34-    const session = await auth();
src/lib/actions/two-factor-actions.ts-35-    const userId = session?.user?.id;
src/lib/actions/two-factor-actions.ts-36-
src/lib/actions/two-factor-actions.ts-37-    if (!userId) {
--
src/lib/actions/two-factor-actions.ts-78- * Enables 2FA after verifying the setup token
src/lib/actions/two-factor-actions.ts-79- */
src/lib/actions/two-factor-actions.ts:80:export async function enableTwoFactor(
src/lib/actions/two-factor-actions.ts-81-  secret: string,
src/lib/actions/two-factor-actions.ts-82-  token: string,
src/lib/actions/two-factor-actions.ts-83-  backupCodes: string[]
src/lib/actions/two-factor-actions.ts-84-): Promise<TwoFactorVerifyResult> {
src/lib/actions/two-factor-actions.ts-85-  try {
--
src/lib/actions/two-factor-actions.ts-122- * Disables 2FA for the current user
src/lib/actions/two-factor-actions.ts-123- */
src/lib/actions/two-factor-actions.ts:124:export async function disableTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
src/lib/actions/two-factor-actions.ts-125-  try {
src/lib/actions/two-factor-actions.ts-126-    const session = await auth();
src/lib/actions/two-factor-actions.ts-127-    const userId = session?.user?.id;
src/lib/actions/two-factor-actions.ts-128-
src/lib/actions/two-factor-actions.ts-129-    if (!userId) {
--
src/lib/actions/two-factor-actions.ts-170- * Verifies a 2FA token for login
src/lib/actions/two-factor-actions.ts-171- */
src/lib/actions/two-factor-actions.ts:172:export async function verifyTwoFactorLogin(
src/lib/actions/two-factor-actions.ts-173-  userId: string,
src/lib/actions/two-factor-actions.ts-174-  token: string
src/lib/actions/two-factor-actions.ts-175-): Promise<TwoFactorVerifyResult> {
src/lib/actions/two-factor-actions.ts-176-  try {
src/lib/actions/two-factor-actions.ts-177-    // Get user from database
--
src/lib/actions/two-factor-actions.ts-221- * Gets 2FA status for the current user
src/lib/actions/two-factor-actions.ts-222- */
src/lib/actions/two-factor-actions.ts:223:export async function getTwoFactorStatus(): Promise<{
src/lib/actions/two-factor-actions.ts-224-  success: boolean;
src/lib/actions/two-factor-actions.ts-225-  enabled: boolean;
src/lib/actions/two-factor-actions.ts-226-  error?: string;
src/lib/actions/two-factor-actions.ts-227-}> {
src/lib/actions/two-factor-actions.ts-228-  try {
--
src/lib/actions/two-factor-actions.ts-253- * Regenerates backup codes for the current user
src/lib/actions/two-factor-actions.ts-254- */
src/lib/actions/two-factor-actions.ts:255:export async function regenerateBackupCodes(token: string): Promise<{
src/lib/actions/two-factor-actions.ts-256-  success: boolean;
src/lib/actions/two-factor-actions.ts-257-  backupCodes?: string[];
src/lib/actions/two-factor-actions.ts-258-  error?: string;
src/lib/actions/two-factor-actions.ts-259-}> {
src/lib/actions/two-factor-actions.ts-260-  try {
--
src/lib/actions/coScholasticActions.ts-30- * Get all co-scholastic activities
src/lib/actions/coScholasticActions.ts-31- */
src/lib/actions/coScholasticActions.ts:32:export async function getCoScholasticActivities(includeInactive = false): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-33-  try {
src/lib/actions/coScholasticActions.ts-34-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-35-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/coScholasticActions.ts-36-
src/lib/actions/coScholasticActions.ts-37-    const activities = await db.coScholasticActivity.findMany({
--
src/lib/actions/coScholasticActions.ts-65- * Get a single co-scholastic activity
src/lib/actions/coScholasticActions.ts-66- */
src/lib/actions/coScholasticActions.ts:67:export async function getCoScholasticActivity(id: string): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-68-  try {
src/lib/actions/coScholasticActions.ts-69-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-70-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/coScholasticActions.ts-71-
src/lib/actions/coScholasticActions.ts-72-    const activity = await db.coScholasticActivity.findUnique({
--
src/lib/actions/coScholasticActions.ts-98- * Create a new co-scholastic activity
src/lib/actions/coScholasticActions.ts-99- */
src/lib/actions/coScholasticActions.ts:100:export async function createCoScholasticActivity(input: CoScholasticActivityInput): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-101-  try {
src/lib/actions/coScholasticActions.ts-102-    // Validate input
src/lib/actions/coScholasticActions.ts-103-    if (!input.name || input.name.trim() === "") {
src/lib/actions/coScholasticActions.ts-104-      return { success: false, error: "Activity name is required" };
src/lib/actions/coScholasticActions.ts-105-    }
--
src/lib/actions/coScholasticActions.ts-156- * Update a co-scholastic activity
src/lib/actions/coScholasticActions.ts-157- */
src/lib/actions/coScholasticActions.ts:158:export async function updateCoScholasticActivity(id: string, input: CoScholasticActivityInput): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-159-  try {
src/lib/actions/coScholasticActions.ts-160-    // Validate input
src/lib/actions/coScholasticActions.ts-161-    if (!input.name || input.name.trim() === "") {
src/lib/actions/coScholasticActions.ts-162-      return { success: false, error: "Activity name is required" };
src/lib/actions/coScholasticActions.ts-163-    }
--
src/lib/actions/coScholasticActions.ts-226- * Delete a co-scholastic activity
src/lib/actions/coScholasticActions.ts-227- */
src/lib/actions/coScholasticActions.ts:228:export async function deleteCoScholasticActivity(id: string): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-229-  try {
src/lib/actions/coScholasticActions.ts-230-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-231-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/coScholasticActions.ts-232-
src/lib/actions/coScholasticActions.ts-233-    // Check if activity has any grades
--
src/lib/actions/coScholasticActions.ts-262- * Toggle activity active status
src/lib/actions/coScholasticActions.ts-263- */
src/lib/actions/coScholasticActions.ts:264:export async function toggleCoScholasticActivityStatus(id: string): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-265-  try {
src/lib/actions/coScholasticActions.ts-266-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-267-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/coScholasticActions.ts-268-
src/lib/actions/coScholasticActions.ts-269-    const activity = await db.coScholasticActivity.findUnique({
--
src/lib/actions/coScholasticActions.ts-297- * Get co-scholastic grades for a student and term
src/lib/actions/coScholasticActions.ts-298- */
src/lib/actions/coScholasticActions.ts:299:export async function getCoScholasticGrades(studentId: string, termId: string): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-300-  try {
src/lib/actions/coScholasticActions.ts-301-    const grades = await db.coScholasticGrade.findMany({
src/lib/actions/coScholasticActions.ts-302-      where: {
src/lib/actions/coScholasticActions.ts-303-        studentId,
src/lib/actions/coScholasticActions.ts-304-        termId,
--
src/lib/actions/coScholasticActions.ts-327- * Get co-scholastic grades for a class and term
src/lib/actions/coScholasticActions.ts-328- */
src/lib/actions/coScholasticActions.ts:329:export async function getCoScholasticGradesByClass(
src/lib/actions/coScholasticActions.ts-330-  classId: string,
src/lib/actions/coScholasticActions.ts-331-  sectionId: string,
src/lib/actions/coScholasticActions.ts-332-  termId: string,
src/lib/actions/coScholasticActions.ts-333-  activityId?: string
src/lib/actions/coScholasticActions.ts-334-): Promise<ActionResult> {
--
src/lib/actions/coScholasticActions.ts-408- * Save or update a co-scholastic grade
src/lib/actions/coScholasticActions.ts-409- */
src/lib/actions/coScholasticActions.ts:410:export async function saveCoScholasticGrade(input: CoScholasticGradeInput): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-411-  try {
src/lib/actions/coScholasticActions.ts-412-    // Validate input
src/lib/actions/coScholasticActions.ts-413-    if (!input.activityId || !input.studentId || !input.termId) {
src/lib/actions/coScholasticActions.ts-414-      return { success: false, error: "Activity, student, and term are required" };
src/lib/actions/coScholasticActions.ts-415-    }
--
src/lib/actions/coScholasticActions.ts-502- * Save multiple co-scholastic grades in bulk
src/lib/actions/coScholasticActions.ts-503- */
src/lib/actions/coScholasticActions.ts:504:export async function saveCoScholasticGradesBulk(grades: CoScholasticGradeInput[]): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-505-  try {
src/lib/actions/coScholasticActions.ts-506-    if (!grades || grades.length === 0) {
src/lib/actions/coScholasticActions.ts-507-      return { success: false, error: "No grades provided" };
src/lib/actions/coScholasticActions.ts-508-    }
src/lib/actions/coScholasticActions.ts-509-
--
src/lib/actions/coScholasticActions.ts-546- * Delete a co-scholastic grade
src/lib/actions/coScholasticActions.ts-547- */
src/lib/actions/coScholasticActions.ts:548:export async function deleteCoScholasticGrade(id: string): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-549-  try {
src/lib/actions/coScholasticActions.ts-550-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-551-    // Usually grades are unique by ID but checking context implies fetching first or relying on DB RLS concepts.
src/lib/actions/coScholasticActions.ts-552-    // For now we assume if user has access to school, they can del grade if ID exists.
src/lib/actions/coScholasticActions.ts-553-    // Ideally we check ownership or link. 
--
src/lib/actions/coScholasticActions.ts-575- * Get terms for dropdown selection
src/lib/actions/coScholasticActions.ts-576- */
src/lib/actions/coScholasticActions.ts:577:export async function getTermsForCoScholastic(): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-578-  try {
src/lib/actions/coScholasticActions.ts-579-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-580-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/coScholasticActions.ts-581-
src/lib/actions/coScholasticActions.ts-582-    const terms = await db.term.findMany({
--
src/lib/actions/coScholasticActions.ts-619- * Get classes for dropdown selection
src/lib/actions/coScholasticActions.ts-620- */
src/lib/actions/coScholasticActions.ts:621:export async function getClassesForCoScholastic(): Promise<ActionResult> {
src/lib/actions/coScholasticActions.ts-622-  try {
src/lib/actions/coScholasticActions.ts-623-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/coScholasticActions.ts-624-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/coScholasticActions.ts-625-
src/lib/actions/coScholasticActions.ts-626-    const classes = await db.class.findMany({
--
src/lib/actions/flashcard-actions.ts-33- * Get all flashcard decks for a student
src/lib/actions/flashcard-actions.ts-34- */
src/lib/actions/flashcard-actions.ts:35:export async function getFlashcardDecks(studentId?: string) {
src/lib/actions/flashcard-actions.ts-36-  try {
src/lib/actions/flashcard-actions.ts-37-    const session = await auth();
src/lib/actions/flashcard-actions.ts-38-    if (!session?.user?.id) {
src/lib/actions/flashcard-actions.ts-39-      throw new Error("Not authenticated");
src/lib/actions/flashcard-actions.ts-40-    }
--
src/lib/actions/flashcard-actions.ts-91- * Get a specific flashcard deck with cards
src/lib/actions/flashcard-actions.ts-92- */
src/lib/actions/flashcard-actions.ts:93:export async function getFlashcardDeck(deckId: string) {
src/lib/actions/flashcard-actions.ts-94-  try {
src/lib/actions/flashcard-actions.ts-95-    const session = await auth();
src/lib/actions/flashcard-actions.ts-96-    if (!session?.user?.id) {
src/lib/actions/flashcard-actions.ts-97-      throw new Error("Not authenticated");
src/lib/actions/flashcard-actions.ts-98-    }
--
src/lib/actions/flashcard-actions.ts-135- * Create a new flashcard deck
src/lib/actions/flashcard-actions.ts-136- */
src/lib/actions/flashcard-actions.ts:137:export async function createFlashcardDeck(data: {
src/lib/actions/flashcard-actions.ts-138-  name: string;
src/lib/actions/flashcard-actions.ts-139-  description?: string;
src/lib/actions/flashcard-actions.ts-140-  subject: string;
src/lib/actions/flashcard-actions.ts-141-  isPublic?: boolean;
src/lib/actions/flashcard-actions.ts-142-}) {
--
src/lib/actions/flashcard-actions.ts-184- * Update a flashcard deck
src/lib/actions/flashcard-actions.ts-185- */
src/lib/actions/flashcard-actions.ts:186:export async function updateFlashcardDeck(
src/lib/actions/flashcard-actions.ts-187-  deckId: string,
src/lib/actions/flashcard-actions.ts-188-  data: {
src/lib/actions/flashcard-actions.ts-189-    name?: string;
src/lib/actions/flashcard-actions.ts-190-    description?: string;
src/lib/actions/flashcard-actions.ts-191-    subject?: string;
--
src/lib/actions/flashcard-actions.ts-246- * Delete a flashcard deck
src/lib/actions/flashcard-actions.ts-247- */
src/lib/actions/flashcard-actions.ts:248:export async function deleteFlashcardDeck(deckId: string) {
src/lib/actions/flashcard-actions.ts-249-  try {
src/lib/actions/flashcard-actions.ts-250-    const session = await auth();
src/lib/actions/flashcard-actions.ts-251-    if (!session?.user?.id) {
src/lib/actions/flashcard-actions.ts-252-      throw new Error("Not authenticated");
src/lib/actions/flashcard-actions.ts-253-    }
--
src/lib/actions/flashcard-actions.ts-291- * Create a new flashcard in a deck
src/lib/actions/flashcard-actions.ts-292- */
src/lib/actions/flashcard-actions.ts:293:export async function createFlashcard(
src/lib/actions/flashcard-actions.ts-294-  deckId: string,
src/lib/actions/flashcard-actions.ts-295-  data: {
src/lib/actions/flashcard-actions.ts-296-    front: string;
src/lib/actions/flashcard-actions.ts-297-    back: string;
src/lib/actions/flashcard-actions.ts-298-    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
--
src/lib/actions/flashcard-actions.ts-354- * Update a flashcard
src/lib/actions/flashcard-actions.ts-355- */
src/lib/actions/flashcard-actions.ts:356:export async function updateFlashcard(
src/lib/actions/flashcard-actions.ts-357-  cardId: string,
src/lib/actions/flashcard-actions.ts-358-  data: {
src/lib/actions/flashcard-actions.ts-359-    front?: string;
src/lib/actions/flashcard-actions.ts-360-    back?: string;
src/lib/actions/flashcard-actions.ts-361-    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
--
src/lib/actions/flashcard-actions.ts-413- * Delete a flashcard
src/lib/actions/flashcard-actions.ts-414- */
src/lib/actions/flashcard-actions.ts:415:export async function deleteFlashcard(cardId: string) {
src/lib/actions/flashcard-actions.ts-416-  try {
src/lib/actions/flashcard-actions.ts-417-    const session = await auth();
src/lib/actions/flashcard-actions.ts-418-    if (!session?.user?.id) {
src/lib/actions/flashcard-actions.ts-419-      throw new Error("Not authenticated");
src/lib/actions/flashcard-actions.ts-420-    }
--
src/lib/actions/flashcard-actions.ts-458- * Record flashcard review result
src/lib/actions/flashcard-actions.ts-459- */
src/lib/actions/flashcard-actions.ts:460:export async function recordFlashcardReview(cardId: string, correct: boolean) {
src/lib/actions/flashcard-actions.ts-461-  try {
src/lib/actions/flashcard-actions.ts-462-    const session = await auth();
src/lib/actions/flashcard-actions.ts-463-    if (!session?.user?.id) {
src/lib/actions/flashcard-actions.ts-464-      throw new Error("Not authenticated");
src/lib/actions/flashcard-actions.ts-465-    }
--
src/lib/actions/flashcard-actions.ts-507- * Get flashcard study statistics
src/lib/actions/flashcard-actions.ts-508- */
src/lib/actions/flashcard-actions.ts:509:export async function getFlashcardStats(deckId: string) {
src/lib/actions/flashcard-actions.ts-510-  try {
src/lib/actions/flashcard-actions.ts-511-    const session = await auth();
src/lib/actions/flashcard-actions.ts-512-    if (!session?.user?.id) {
src/lib/actions/flashcard-actions.ts-513-      throw new Error("Not authenticated");
src/lib/actions/flashcard-actions.ts-514-    }
--
src/lib/actions/calendar-widget-actions.ts-16- * Admins can see all events for their school
src/lib/actions/calendar-widget-actions.ts-17- */
src/lib/actions/calendar-widget-actions.ts:18:export async function getAdminCalendarEvents(limit: number = 5) {
src/lib/actions/calendar-widget-actions.ts-19-  try {
src/lib/actions/calendar-widget-actions.ts-20-    const session = await auth();
src/lib/actions/calendar-widget-actions.ts-21-    const userId = session?.user?.id;
src/lib/actions/calendar-widget-actions.ts-22-    if (!userId) {
src/lib/actions/calendar-widget-actions.ts-23-      return { success: false, error: "Unauthorized", data: [] };
--
src/lib/actions/calendar-widget-actions.ts-56- * Teachers see events visible to their role in their school
src/lib/actions/calendar-widget-actions.ts-57- */
src/lib/actions/calendar-widget-actions.ts:58:export async function getTeacherCalendarEvents(limit: number = 5) {
src/lib/actions/calendar-widget-actions.ts-59-  try {
src/lib/actions/calendar-widget-actions.ts-60-    const session = await auth();
src/lib/actions/calendar-widget-actions.ts-61-    const userId = session?.user?.id;
src/lib/actions/calendar-widget-actions.ts-62-    if (!userId) {
src/lib/actions/calendar-widget-actions.ts-63-      return { success: false, error: "Unauthorized", data: [] };
--
src/lib/actions/calendar-widget-actions.ts-117- * Students see events visible to their role and their class/section in their school
src/lib/actions/calendar-widget-actions.ts-118- */
src/lib/actions/calendar-widget-actions.ts:119:export async function getStudentCalendarEvents(limit: number = 5) {
src/lib/actions/calendar-widget-actions.ts-120-  try {
src/lib/actions/calendar-widget-actions.ts-121-    const session = await auth();
src/lib/actions/calendar-widget-actions.ts-122-    const userId = session?.user?.id;
src/lib/actions/calendar-widget-actions.ts-123-    if (!userId) {
src/lib/actions/calendar-widget-actions.ts-124-      return { success: false, error: "Unauthorized", data: [] };
--
src/lib/actions/calendar-widget-actions.ts-202- * Parents see events visible to their children in their school
src/lib/actions/calendar-widget-actions.ts-203- */
src/lib/actions/calendar-widget-actions.ts:204:export async function getParentCalendarEvents(limit: number = 5) {
src/lib/actions/calendar-widget-actions.ts-205-  try {
src/lib/actions/calendar-widget-actions.ts-206-    const session = await auth();
src/lib/actions/calendar-widget-actions.ts-207-    const userId = session?.user?.id;
src/lib/actions/calendar-widget-actions.ts-208-    if (!userId) {
src/lib/actions/calendar-widget-actions.ts-209-      return { success: false, error: "Unauthorized", data: [] };
--
src/lib/actions/performanceReportActions.ts-5-
src/lib/actions/performanceReportActions.ts-6-// Get overall school performance
src/lib/actions/performanceReportActions.ts:7:export async function getOverallSchoolPerformance(filters?: {
src/lib/actions/performanceReportActions.ts-8-  academicYearId?: string;
src/lib/actions/performanceReportActions.ts-9-  termId?: string;
src/lib/actions/performanceReportActions.ts-10-}) {
src/lib/actions/performanceReportActions.ts-11-  try {
src/lib/actions/performanceReportActions.ts-12-    const context = await requireSchoolAccess();
--
src/lib/actions/performanceReportActions.ts-71-
src/lib/actions/performanceReportActions.ts-72-// Get teacher performance metrics
src/lib/actions/performanceReportActions.ts:73:export async function getTeacherPerformanceMetrics(filters?: {
src/lib/actions/performanceReportActions.ts-74-  teacherId?: string;
src/lib/actions/performanceReportActions.ts-75-  academicYearId?: string;
src/lib/actions/performanceReportActions.ts-76-}) {
src/lib/actions/performanceReportActions.ts-77-  try {
src/lib/actions/performanceReportActions.ts-78-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/performanceReportActions.ts-149-
src/lib/actions/performanceReportActions.ts-150-// Get student progress tracking
src/lib/actions/performanceReportActions.ts:151:export async function getStudentProgressTracking(studentId: string) {
src/lib/actions/performanceReportActions.ts-152-  try {
src/lib/actions/performanceReportActions.ts-153-    const context = await requireSchoolAccess();
src/lib/actions/performanceReportActions.ts-154-    const schoolId = context.schoolId;
src/lib/actions/performanceReportActions.ts-155-    
src/lib/actions/performanceReportActions.ts-156-    if (!schoolId) {
--
src/lib/actions/performanceReportActions.ts-237-
src/lib/actions/performanceReportActions.ts-238-// Get comparative analysis
src/lib/actions/performanceReportActions.ts:239:export async function getComparativeAnalysis(filters?: {
src/lib/actions/performanceReportActions.ts-240-  academicYearId?: string;
src/lib/actions/performanceReportActions.ts-241-  compareBy?: "class" | "term" | "subject";
src/lib/actions/performanceReportActions.ts-242-}) {
src/lib/actions/performanceReportActions.ts-243-  try {
src/lib/actions/performanceReportActions.ts-244-    const context = await requireSchoolAccess();
--
src/lib/actions/certificateGenerationActions.ts-28- * Generate certificates for multiple students
src/lib/actions/certificateGenerationActions.ts-29- */
src/lib/actions/certificateGenerationActions.ts:30:export async function bulkGenerateCertificates(
src/lib/actions/certificateGenerationActions.ts-31-  templateId: string,
src/lib/actions/certificateGenerationActions.ts-32-  studentIds: string[]
src/lib/actions/certificateGenerationActions.ts-33-) {
src/lib/actions/certificateGenerationActions.ts-34-  try {
src/lib/actions/certificateGenerationActions.ts-35-    const user = await currentUser();
--
src/lib/actions/certificateGenerationActions.ts-150- * Generate a single certificate for a student
src/lib/actions/certificateGenerationActions.ts-151- */
src/lib/actions/certificateGenerationActions.ts:152:export async function generateCertificateForStudent(
src/lib/actions/certificateGenerationActions.ts-153-  templateId: string,
src/lib/actions/certificateGenerationActions.ts-154-  studentId: string,
src/lib/actions/certificateGenerationActions.ts-155-  additionalData?: Record<string, any>
src/lib/actions/certificateGenerationActions.ts-156-) {
src/lib/actions/certificateGenerationActions.ts-157-  try {
--
src/lib/actions/certificateGenerationActions.ts-258- * Get all generated certificates with filters
src/lib/actions/certificateGenerationActions.ts-259- */
src/lib/actions/certificateGenerationActions.ts:260:export async function getGeneratedCertificates(filters?: {
src/lib/actions/certificateGenerationActions.ts-261-  templateId?: string;
src/lib/actions/certificateGenerationActions.ts-262-  studentId?: string;
src/lib/actions/certificateGenerationActions.ts-263-  status?: string;
src/lib/actions/certificateGenerationActions.ts-264-  startDate?: Date;
src/lib/actions/certificateGenerationActions.ts-265-  endDate?: Date;
--
src/lib/actions/certificateGenerationActions.ts-336- * Get certificates for a specific student
src/lib/actions/certificateGenerationActions.ts-337- */
src/lib/actions/certificateGenerationActions.ts:338:export async function getCertificatesForStudent(studentId: string) {
src/lib/actions/certificateGenerationActions.ts-339-  try {
src/lib/actions/certificateGenerationActions.ts-340-    const user = await currentUser();
src/lib/actions/certificateGenerationActions.ts-341-    if (!user) {
src/lib/actions/certificateGenerationActions.ts-342-      return { success: false, error: "Unauthorized" };
src/lib/actions/certificateGenerationActions.ts-343-    }
--
src/lib/actions/certificateGenerationActions.ts-357- * Verify a certificate by verification code
src/lib/actions/certificateGenerationActions.ts-358- */
src/lib/actions/certificateGenerationActions.ts:359:export async function verifyCertificateByCode(verificationCode: string) {
src/lib/actions/certificateGenerationActions.ts-360-  try {
src/lib/actions/certificateGenerationActions.ts-361-    const result = await verifyCertificate(verificationCode);
src/lib/actions/certificateGenerationActions.ts-362-    return result;
src/lib/actions/certificateGenerationActions.ts-363-  } catch (error: any) {
src/lib/actions/certificateGenerationActions.ts-364-    console.error("Error in verifyCertificateByCode:", error);
--
src/lib/actions/certificateGenerationActions.ts-373- * Revoke a certificate
src/lib/actions/certificateGenerationActions.ts-374- */
src/lib/actions/certificateGenerationActions.ts:375:export async function revokeCertificateById(
src/lib/actions/certificateGenerationActions.ts-376-  certificateId: string,
src/lib/actions/certificateGenerationActions.ts-377-  reason: string
src/lib/actions/certificateGenerationActions.ts-378-) {
src/lib/actions/certificateGenerationActions.ts-379-  try {
src/lib/actions/certificateGenerationActions.ts-380-    const user = await currentUser();
--
src/lib/actions/certificateGenerationActions.ts-414- * Get certificate generation statistics
src/lib/actions/certificateGenerationActions.ts-415- */
src/lib/actions/certificateGenerationActions.ts:416:export async function getCertificateGenerationStats() {
src/lib/actions/certificateGenerationActions.ts-417-  try {
src/lib/actions/certificateGenerationActions.ts-418-    const user = await currentUser();
src/lib/actions/certificateGenerationActions.ts-419-    if (!user) {
src/lib/actions/certificateGenerationActions.ts-420-      return { success: false, error: "Unauthorized" };
src/lib/actions/certificateGenerationActions.ts-421-    }
--
src/lib/actions/student-performance-actions.ts-56- * Get overall performance summary
src/lib/actions/student-performance-actions.ts-57- */
src/lib/actions/student-performance-actions.ts:58:export async function getPerformanceSummary() {
src/lib/actions/student-performance-actions.ts-59-  // Add school isolation
src/lib/actions/student-performance-actions.ts-60-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/student-performance-actions.ts-61-  const schoolId = await getRequiredSchoolId();
src/lib/actions/student-performance-actions.ts-62-
src/lib/actions/student-performance-actions.ts-63-  const student = await getCurrentStudent(schoolId);
--
src/lib/actions/student-performance-actions.ts-166- * Get subject performance data
src/lib/actions/student-performance-actions.ts-167- */
src/lib/actions/student-performance-actions.ts:168:export async function getSubjectPerformance() {
src/lib/actions/student-performance-actions.ts-169-  // Add school isolation
src/lib/actions/student-performance-actions.ts-170-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/student-performance-actions.ts-171-  const schoolId = await getRequiredSchoolId();
src/lib/actions/student-performance-actions.ts-172-
src/lib/actions/student-performance-actions.ts-173-  const student = await getCurrentStudent(schoolId);
--
src/lib/actions/student-performance-actions.ts-254- * Get performance trends over time
src/lib/actions/student-performance-actions.ts-255- */
src/lib/actions/student-performance-actions.ts:256:export async function getPerformanceTrends() {
src/lib/actions/student-performance-actions.ts-257-  // Add school isolation
src/lib/actions/student-performance-actions.ts-258-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/student-performance-actions.ts-259-  const schoolId = await getRequiredSchoolId();
src/lib/actions/student-performance-actions.ts-260-
src/lib/actions/student-performance-actions.ts-261-  const student = await getCurrentStudent(schoolId);
--
src/lib/actions/student-performance-actions.ts-421- * Get attendance vs performance data
src/lib/actions/student-performance-actions.ts-422- */
src/lib/actions/student-performance-actions.ts:423:export async function getAttendanceVsPerformance() {
src/lib/actions/student-performance-actions.ts-424-  // Add school isolation
src/lib/actions/student-performance-actions.ts-425-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/student-performance-actions.ts-426-  const schoolId = await getRequiredSchoolId();
src/lib/actions/student-performance-actions.ts-427-
src/lib/actions/student-performance-actions.ts-428-  const student = await getCurrentStudent(schoolId);
--
src/lib/actions/student-performance-actions.ts-513- * Get class rank analysis
src/lib/actions/student-performance-actions.ts-514- */
src/lib/actions/student-performance-actions.ts:515:export async function getClassRankAnalysis() {
src/lib/actions/student-performance-actions.ts-516-  // Add school isolation
src/lib/actions/student-performance-actions.ts-517-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/student-performance-actions.ts-518-  const schoolId = await getRequiredSchoolId();
src/lib/actions/student-performance-actions.ts-519-
src/lib/actions/student-performance-actions.ts-520-  const student = await getCurrentStudent(schoolId);
--
src/lib/actions/student-course-actions.ts-42- * Requirements: AC1
src/lib/actions/student-course-actions.ts-43- */
src/lib/actions/student-course-actions.ts:44:export async function getCourseById(courseId: string) {
src/lib/actions/student-course-actions.ts-45-  try {
src/lib/actions/student-course-actions.ts-46-    // Validate input
src/lib/actions/student-course-actions.ts-47-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-48-
src/lib/actions/student-course-actions.ts-49-    // Get current student
--
src/lib/actions/student-course-actions.ts-130- * Requirements: AC4
src/lib/actions/student-course-actions.ts-131- */
src/lib/actions/student-course-actions.ts:132:export async function enrollInCourse(courseId: string) {
src/lib/actions/student-course-actions.ts-133-  try {
src/lib/actions/student-course-actions.ts-134-    // Validate input
src/lib/actions/student-course-actions.ts-135-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-136-
src/lib/actions/student-course-actions.ts-137-    // Get current student
--
src/lib/actions/student-course-actions.ts-229- * Requirements: AC4
src/lib/actions/student-course-actions.ts-230- */
src/lib/actions/student-course-actions.ts:231:export async function unenrollFromCourse(courseId: string) {
src/lib/actions/student-course-actions.ts-232-  try {
src/lib/actions/student-course-actions.ts-233-    // Validate input
src/lib/actions/student-course-actions.ts-234-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-235-
src/lib/actions/student-course-actions.ts-236-    // Get current student
--
src/lib/actions/student-course-actions.ts-283- * Requirements: AC9
src/lib/actions/student-course-actions.ts-284- */
src/lib/actions/student-course-actions.ts:285:export async function getModulesByCourse(courseId: string) {
src/lib/actions/student-course-actions.ts-286-  try {
src/lib/actions/student-course-actions.ts-287-    // Validate input
src/lib/actions/student-course-actions.ts-288-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-289-
src/lib/actions/student-course-actions.ts-290-    // Get current student
--
src/lib/actions/student-course-actions.ts-410- * Requirements: AC2
src/lib/actions/student-course-actions.ts-411- */
src/lib/actions/student-course-actions.ts:412:export async function getLessonById(lessonId: string, courseId: string) {
src/lib/actions/student-course-actions.ts-413-  try {
src/lib/actions/student-course-actions.ts-414-    // Validate input
src/lib/actions/student-course-actions.ts-415-    const validatedLessonId = lessonIdSchema.parse(lessonId);
src/lib/actions/student-course-actions.ts-416-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-417-
--
src/lib/actions/student-course-actions.ts-651- * Requirements: AC3
src/lib/actions/student-course-actions.ts-652- */
src/lib/actions/student-course-actions.ts:653:export async function markLessonComplete(lessonId: string, enrollmentId: string) {
src/lib/actions/student-course-actions.ts-654-  try {
src/lib/actions/student-course-actions.ts-655-    // Validate input
src/lib/actions/student-course-actions.ts-656-    const validatedLessonId = lessonIdSchema.parse(lessonId);
src/lib/actions/student-course-actions.ts-657-    const validatedEnrollmentId = enrollmentIdSchema.parse(enrollmentId);
src/lib/actions/student-course-actions.ts-658-
--
src/lib/actions/student-course-actions.ts-786- * Requirements: AC3
src/lib/actions/student-course-actions.ts-787- */
src/lib/actions/student-course-actions.ts:788:export async function updateLessonProgress(
src/lib/actions/student-course-actions.ts-789-  lessonId: string,
src/lib/actions/student-course-actions.ts-790-  enrollmentId: string,
src/lib/actions/student-course-actions.ts-791-  progress: number
src/lib/actions/student-course-actions.ts-792-) {
src/lib/actions/student-course-actions.ts-793-  try {
--
src/lib/actions/student-course-actions.ts-876- * Requirements: AC3
src/lib/actions/student-course-actions.ts-877- */
src/lib/actions/student-course-actions.ts:878:export async function getCourseProgress(courseId: string) {
src/lib/actions/student-course-actions.ts-879-  try {
src/lib/actions/student-course-actions.ts-880-    // Validate input
src/lib/actions/student-course-actions.ts-881-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-882-
src/lib/actions/student-course-actions.ts-883-    // Get current student
--
src/lib/actions/student-course-actions.ts-976- * Requirements: AC2
src/lib/actions/student-course-actions.ts-977- */
src/lib/actions/student-course-actions.ts:978:export async function getNextLesson(currentLessonId: string, courseId: string) {
src/lib/actions/student-course-actions.ts-979-  try {
src/lib/actions/student-course-actions.ts-980-    // Validate input
src/lib/actions/student-course-actions.ts-981-    const validatedLessonId = lessonIdSchema.parse(currentLessonId);
src/lib/actions/student-course-actions.ts-982-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-983-
--
src/lib/actions/student-course-actions.ts-1096- * Requirements: AC2
src/lib/actions/student-course-actions.ts-1097- */
src/lib/actions/student-course-actions.ts:1098:export async function getPreviousLesson(currentLessonId: string, courseId: string) {
src/lib/actions/student-course-actions.ts-1099-  try {
src/lib/actions/student-course-actions.ts-1100-    // Validate input
src/lib/actions/student-course-actions.ts-1101-    const validatedLessonId = lessonIdSchema.parse(currentLessonId);
src/lib/actions/student-course-actions.ts-1102-    const validatedCourseId = courseIdSchema.parse(courseId);
src/lib/actions/student-course-actions.ts-1103-
--
src/lib/actions/subjectsActions.ts-378-
src/lib/actions/subjectsActions.ts-379-// Get available subjects to generate (those not already created)
src/lib/actions/subjectsActions.ts:380:export async function getAvailableSubjectTemplates() {
src/lib/actions/subjectsActions.ts-381-  try {
src/lib/actions/subjectsActions.ts-382-    const existingSubjects = await db.subject.findMany({
src/lib/actions/subjectsActions.ts-383-      select: { code: true }
src/lib/actions/subjectsActions.ts-384-    });
src/lib/actions/subjectsActions.ts-385-    const existingCodes = new Set(existingSubjects.map(s => s.code.toUpperCase()));
--
src/lib/actions/budgetActions.ts-6-
src/lib/actions/budgetActions.ts-7-// Get all budgets with filters
src/lib/actions/budgetActions.ts:8:export async function getBudgets(filters?: {
src/lib/actions/budgetActions.ts-9-  academicYearId?: string;
src/lib/actions/budgetActions.ts-10-  category?: string;
src/lib/actions/budgetActions.ts-11-  status?: string;
src/lib/actions/budgetActions.ts-12-  limit?: number;
src/lib/actions/budgetActions.ts-13-}) {
--
src/lib/actions/budgetActions.ts-50-
src/lib/actions/budgetActions.ts-51-// Get single budget by ID
src/lib/actions/budgetActions.ts:52:export async function getBudgetById(id: string) {
src/lib/actions/budgetActions.ts-53-  try {
src/lib/actions/budgetActions.ts-54-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-55-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-56-    const budget = await db.budget.findUnique({
src/lib/actions/budgetActions.ts-57-      where: { id, schoolId },
--
src/lib/actions/budgetActions.ts-70-
src/lib/actions/budgetActions.ts-71-// Create new budget
src/lib/actions/budgetActions.ts:72:export async function createBudget(data: any) {
src/lib/actions/budgetActions.ts-73-  try {
src/lib/actions/budgetActions.ts-74-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-75-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-76-    const budget = await db.budget.create({
src/lib/actions/budgetActions.ts-77-      data: {
--
src/lib/actions/budgetActions.ts-97-
src/lib/actions/budgetActions.ts-98-// Update budget
src/lib/actions/budgetActions.ts:99:export async function updateBudget(id: string, data: any) {
src/lib/actions/budgetActions.ts-100-  try {
src/lib/actions/budgetActions.ts-101-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-102-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-103-    const budget = await db.budget.update({
src/lib/actions/budgetActions.ts-104-      where: { id, schoolId },
--
src/lib/actions/budgetActions.ts-122-
src/lib/actions/budgetActions.ts-123-// Delete budget
src/lib/actions/budgetActions.ts:124:export async function deleteBudget(id: string) {
src/lib/actions/budgetActions.ts-125-  try {
src/lib/actions/budgetActions.ts-126-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-127-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-128-    await db.budget.delete({
src/lib/actions/budgetActions.ts-129-      where: { id, schoolId },
--
src/lib/actions/budgetActions.ts-139-
src/lib/actions/budgetActions.ts-140-// Get budget utilization
src/lib/actions/budgetActions.ts:141:export async function getBudgetUtilization(budgetId: string) {
src/lib/actions/budgetActions.ts-142-  try {
src/lib/actions/budgetActions.ts-143-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-144-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-145-    const budget = await db.budget.findUnique({
src/lib/actions/budgetActions.ts-146-      where: { id: budgetId, schoolId },
--
src/lib/actions/budgetActions.ts-175-
src/lib/actions/budgetActions.ts-176-// Get budget statistics
src/lib/actions/budgetActions.ts:177:export async function getBudgetStats(academicYearId?: string) {
src/lib/actions/budgetActions.ts-178-  try {
src/lib/actions/budgetActions.ts-179-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-180-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-181-    const where: any = { schoolId };
src/lib/actions/budgetActions.ts-182-    if (academicYearId) where.academicYearId = academicYearId;
--
src/lib/actions/budgetActions.ts-261-// Update budget spent amount (called when expenses are added)
src/lib/actions/budgetActions.ts-262-// Note: Spent amounts are now calculated from expenses, so this function just revalidates
src/lib/actions/budgetActions.ts:263:export async function updateBudgetSpentAmount(category: string, year: number, amount: number) {
src/lib/actions/budgetActions.ts-264-  try {
src/lib/actions/budgetActions.ts-265-    const { schoolId } = await requireSchoolAccess(); // Ensure context check even if logic empty
src/lib/actions/budgetActions.ts-266-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-267-    // Spent amounts are calculated from expenses relation, no need to update
src/lib/actions/budgetActions.ts-268-    revalidatePath("/admin/finance/budget");
--
src/lib/actions/budgetActions.ts-275-
src/lib/actions/budgetActions.ts-276-// Get budget alerts (over budget or near limit)
src/lib/actions/budgetActions.ts:277:export async function getBudgetAlerts(academicYearId?: string) {
src/lib/actions/budgetActions.ts-278-  try {
src/lib/actions/budgetActions.ts-279-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/budgetActions.ts-280-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/budgetActions.ts-281-    const where: any = { status: "Active", schoolId };
src/lib/actions/budgetActions.ts-282-    if (academicYearId) where.academicYearId = academicYearId;
--
src/lib/actions/marksEntryActions.ts-45- * Get enrolled students for marks entry
src/lib/actions/marksEntryActions.ts-46- */
src/lib/actions/marksEntryActions.ts:47:export async function getEnrolledStudentsForMarks(
src/lib/actions/marksEntryActions.ts-48-  examId: string,
src/lib/actions/marksEntryActions.ts-49-  classId: string,
src/lib/actions/marksEntryActions.ts-50-  sectionId: string
src/lib/actions/marksEntryActions.ts-51-): Promise<ActionResult> {
src/lib/actions/marksEntryActions.ts-52-  try {
--
src/lib/actions/marksEntryActions.ts-170- * Save marks in bulk with comprehensive validation
src/lib/actions/marksEntryActions.ts-171- */
src/lib/actions/marksEntryActions.ts:172:export async function saveExamMarks(input: SaveMarksInput): Promise<ActionResult> {
src/lib/actions/marksEntryActions.ts-173-  try {
src/lib/actions/marksEntryActions.ts-174-    // Get current user
src/lib/actions/marksEntryActions.ts-175-    const session = await auth();
src/lib/actions/marksEntryActions.ts-176-    const userId = session?.user?.id;
src/lib/actions/marksEntryActions.ts-177-
--
src/lib/actions/marksEntryActions.ts-469- * Get classes for dropdown
src/lib/actions/marksEntryActions.ts-470- */
src/lib/actions/marksEntryActions.ts:471:export async function getClassesForMarksEntry(): Promise<ActionResult> {
src/lib/actions/marksEntryActions.ts-472-  try {
src/lib/actions/marksEntryActions.ts-473-    const classes = await db.class.findMany({
src/lib/actions/marksEntryActions.ts-474-      include: {
src/lib/actions/marksEntryActions.ts-475-        sections: {
src/lib/actions/marksEntryActions.ts-476-          orderBy: {
--
src/lib/actions/marksEntryActions.ts-503- * Get exams for dropdown
src/lib/actions/marksEntryActions.ts-504- */
src/lib/actions/marksEntryActions.ts:505:export async function getExamsForMarksEntry(): Promise<ActionResult> {
src/lib/actions/marksEntryActions.ts-506-  try {
src/lib/actions/marksEntryActions.ts-507-    const exams = await db.exam.findMany({
src/lib/actions/marksEntryActions.ts-508-      include: {
src/lib/actions/marksEntryActions.ts-509-        subject: {
src/lib/actions/marksEntryActions.ts-510-          select: {
--
src/lib/actions/marksEntryActions.ts-546- * Get audit logs for marks entry
src/lib/actions/marksEntryActions.ts-547- */
src/lib/actions/marksEntryActions.ts:548:export async function getMarksAuditLogs(filters: {
src/lib/actions/marksEntryActions.ts-549-  examId?: string;
src/lib/actions/marksEntryActions.ts-550-  studentId?: string;
src/lib/actions/marksEntryActions.ts-551-  startDate?: Date;
src/lib/actions/marksEntryActions.ts-552-  endDate?: Date;
src/lib/actions/marksEntryActions.ts-553-  limit?: number;
--
src/lib/actions/marksEntryActions.ts-648- * Get last modified info for an exam result
src/lib/actions/marksEntryActions.ts-649- */
src/lib/actions/marksEntryActions.ts:650:export async function getExamResultLastModified(
src/lib/actions/marksEntryActions.ts-651-  examId: string,
src/lib/actions/marksEntryActions.ts-652-  studentId: string
src/lib/actions/marksEntryActions.ts-653-): Promise<ActionResult> {
src/lib/actions/marksEntryActions.ts-654-  try {
src/lib/actions/marksEntryActions.ts-655-    const lastLog = await db.auditLog.findFirst({
--
src/lib/actions/teacherActions.ts-6-
src/lib/actions/teacherActions.ts-7-// Get teacher with detailed information
src/lib/actions/teacherActions.ts:8:export async function getTeacherWithDetails(teacherId: string) {
src/lib/actions/teacherActions.ts-9-  try {
src/lib/actions/teacherActions.ts-10-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherActions.ts-11-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherActions.ts-12-    console.log(`Fetching teacher details for ID: ${teacherId}`);
src/lib/actions/teacherActions.ts-13-
--
src/lib/actions/teacherActions.ts-75-
src/lib/actions/teacherActions.ts-76-// Get available subjects that can be assigned to a teacher
src/lib/actions/teacherActions.ts:77:export async function getAvailableSubjectsForTeacher(teacherId: string) {
src/lib/actions/teacherActions.ts-78-  try {
src/lib/actions/teacherActions.ts-79-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherActions.ts-80-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherActions.ts-81-
src/lib/actions/teacherActions.ts-82-    // Get subjects already assigned to this teacher
--
src/lib/actions/teacherActions.ts-123-
src/lib/actions/teacherActions.ts-124-// Get available classes that can be assigned to a teacher
src/lib/actions/teacherActions.ts:125:export async function getAvailableClassesForTeacher(teacherId: string) {
src/lib/actions/teacherActions.ts-126-  try {
src/lib/actions/teacherActions.ts-127-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherActions.ts-128-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherActions.ts-129-
src/lib/actions/teacherActions.ts-130-    // Get classes already assigned to this teacher
--
src/lib/actions/documentActions.ts-14-
src/lib/actions/documentActions.ts-15-// Document Type Actions
src/lib/actions/documentActions.ts:16:export async function getDocumentTypes() {
src/lib/actions/documentActions.ts-17-  try {
src/lib/actions/documentActions.ts-18-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/documentActions.ts-19-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/documentActions.ts-20-
src/lib/actions/documentActions.ts-21-    const documentTypes = await db.documentType.findMany({
--
src/lib/actions/documentActions.ts-40-}
src/lib/actions/documentActions.ts-41-
src/lib/actions/documentActions.ts:42:export async function getDocumentType(id: string) {
src/lib/actions/documentActions.ts-43-  try {
src/lib/actions/documentActions.ts-44-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/documentActions.ts-45-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/documentActions.ts-46-
src/lib/actions/documentActions.ts-47-    const documentType = await db.documentType.findUnique({
--
src/lib/actions/documentActions.ts-63-}
src/lib/actions/documentActions.ts-64-
src/lib/actions/documentActions.ts:65:export async function createDocumentType(data: DocumentTypeData) {
src/lib/actions/documentActions.ts-66-  try {
src/lib/actions/documentActions.ts-67-    // Validate the data
src/lib/actions/documentActions.ts-68-    const validatedData = documentTypeSchema.parse(data);
src/lib/actions/documentActions.ts-69-
src/lib/actions/documentActions.ts-70-    // Create the document type
--
src/lib/actions/documentActions.ts-91-}
src/lib/actions/documentActions.ts-92-
src/lib/actions/documentActions.ts:93:export async function updateDocumentType(id: string, data: DocumentTypeData) {
src/lib/actions/documentActions.ts-94-  try {
src/lib/actions/documentActions.ts-95-    // Validate the data
src/lib/actions/documentActions.ts-96-    const validatedData = documentTypeSchema.parse(data);
src/lib/actions/documentActions.ts-97-
src/lib/actions/documentActions.ts-98-    // Check if the document type exists
--
src/lib/actions/documentActions.ts-129-}
src/lib/actions/documentActions.ts-130-
src/lib/actions/documentActions.ts:131:export async function deleteDocumentType(id: string) {
src/lib/actions/documentActions.ts-132-  try {
src/lib/actions/documentActions.ts-133-    // Check if the document type exists
src/lib/actions/documentActions.ts-134-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/documentActions.ts-135-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/documentActions.ts-136-
--
src/lib/actions/documentActions.ts-169-
src/lib/actions/documentActions.ts-170-// Document Actions
src/lib/actions/documentActions.ts:171:export async function getDocuments(filter?: DocumentFilterData) {
src/lib/actions/documentActions.ts-172-  try {
src/lib/actions/documentActions.ts-173-    // Validate the filter if provided
src/lib/actions/documentActions.ts-174-    let validatedFilter = {};
src/lib/actions/documentActions.ts-175-    if (filter) {
src/lib/actions/documentActions.ts-176-      validatedFilter = documentFilterSchema.parse(filter);
--
src/lib/actions/documentActions.ts-228-}
src/lib/actions/documentActions.ts-229-
src/lib/actions/documentActions.ts:230:export async function getDocument(id: string) {
src/lib/actions/documentActions.ts-231-  try {
src/lib/actions/documentActions.ts-232-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/documentActions.ts-233-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/documentActions.ts-234-
src/lib/actions/documentActions.ts-235-    const document = await db.document.findUnique({
--
src/lib/actions/documentActions.ts-259-}
src/lib/actions/documentActions.ts-260-
src/lib/actions/documentActions.ts:261:export async function createDocument(data: DocumentData) {
src/lib/actions/documentActions.ts-262-  try {
src/lib/actions/documentActions.ts-263-    // Validate the data
src/lib/actions/documentActions.ts-264-    const validatedData = documentSchema.parse(data);
src/lib/actions/documentActions.ts-265-
src/lib/actions/documentActions.ts-266-    // Verify user exists before creating document
--
src/lib/actions/documentActions.ts-310-}
src/lib/actions/documentActions.ts-311-
src/lib/actions/documentActions.ts:312:export async function updateDocument(id: string, data: DocumentData) {
src/lib/actions/documentActions.ts-313-  try {
src/lib/actions/documentActions.ts-314-    // Validate the data
src/lib/actions/documentActions.ts-315-    const validatedData = documentSchema.parse(data);
src/lib/actions/documentActions.ts-316-
src/lib/actions/documentActions.ts-317-    // Check if the document exists
--
src/lib/actions/documentActions.ts-355-}
src/lib/actions/documentActions.ts-356-
src/lib/actions/documentActions.ts:357:export async function deleteDocument(id: string) {
src/lib/actions/documentActions.ts-358-  try {
src/lib/actions/documentActions.ts-359-    // Check if the document exists
src/lib/actions/documentActions.ts-360-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/documentActions.ts-361-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/documentActions.ts-362-
--
src/lib/actions/documentActions.ts-382-}
src/lib/actions/documentActions.ts-383-
src/lib/actions/documentActions.ts:384:export async function getRecentDocuments(limit: number = 5) {
src/lib/actions/documentActions.ts-385-  try {
src/lib/actions/documentActions.ts-386-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/documentActions.ts-387-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/documentActions.ts-388-
src/lib/actions/documentActions.ts-389-    const documents = await db.document.findMany({
--
src/lib/actions/eventActions.ts-21-import { requireSchoolAccess } from "@/lib/auth/tenant";
src/lib/actions/eventActions.ts-22-
src/lib/actions/eventActions.ts:23:export async function getEvents(filter?: EventFilterData) {
src/lib/actions/eventActions.ts-24-  try {
src/lib/actions/eventActions.ts-25-    // Validate the filter if provided
src/lib/actions/eventActions.ts-26-    let validatedFilter = {};
src/lib/actions/eventActions.ts-27-    if (filter) {
src/lib/actions/eventActions.ts-28-      validatedFilter = eventFilterSchema.parse(filter);
--
src/lib/actions/eventActions.ts-89-}
src/lib/actions/eventActions.ts-90-
src/lib/actions/eventActions.ts:91:export async function getEvent(id: string) {
src/lib/actions/eventActions.ts-92-  try {
src/lib/actions/eventActions.ts-93-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/eventActions.ts-94-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/eventActions.ts-95-
src/lib/actions/eventActions.ts-96-    const event = await db.event.findUnique({
--
src/lib/actions/eventActions.ts-182-}
src/lib/actions/eventActions.ts-183-
src/lib/actions/eventActions.ts:184:export async function createEvent(formData: EventFormDataWithRefinement) {
src/lib/actions/eventActions.ts-185-  try {
src/lib/actions/eventActions.ts-186-    // Validate the data
src/lib/actions/eventActions.ts-187-    const validatedData = eventSchemaWithRefinement.parse(formData);
src/lib/actions/eventActions.ts-188-
src/lib/actions/eventActions.ts-189-    // Create the event in the database
--
src/lib/actions/eventActions.ts-301-}
src/lib/actions/eventActions.ts-302-
src/lib/actions/eventActions.ts:303:export async function updateEvent(id: string, formData: EventFormDataWithRefinement) {
src/lib/actions/eventActions.ts-304-  try {
src/lib/actions/eventActions.ts-305-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/eventActions.ts-306-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/eventActions.ts-307-    
src/lib/actions/eventActions.ts-308-    // Validate the data
--
src/lib/actions/eventActions.ts-382-}
src/lib/actions/eventActions.ts-383-
src/lib/actions/eventActions.ts:384:export async function deleteEvent(id: string) {
src/lib/actions/eventActions.ts-385-  try {
src/lib/actions/eventActions.ts-386-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/eventActions.ts-387-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/eventActions.ts-388-    
src/lib/actions/eventActions.ts-389-    // Check if the event exists
--
src/lib/actions/eventActions.ts-430-}
src/lib/actions/eventActions.ts-431-
src/lib/actions/eventActions.ts:432:export async function updateEventStatus(id: string, status: EventStatus) {
src/lib/actions/eventActions.ts-433-  try {
src/lib/actions/eventActions.ts-434-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/eventActions.ts-435-    if (!schoolId) return { success: false, error: "School context required", data: null };
src/lib/actions/eventActions.ts-436-    
src/lib/actions/eventActions.ts-437-    // Check if the event exists
--
src/lib/actions/eventActions.ts-462-}
src/lib/actions/eventActions.ts-463-
src/lib/actions/eventActions.ts:464:export async function addParticipant(participantData: EventParticipantData) {
src/lib/actions/eventActions.ts-465-  try {
src/lib/actions/eventActions.ts-466-    // Validate the data
src/lib/actions/eventActions.ts-467-    const validatedData = eventParticipantSchema.parse(participantData);
src/lib/actions/eventActions.ts-468-
src/lib/actions/eventActions.ts-469-    // Check if the event exists
--
src/lib/actions/eventActions.ts-528-}
src/lib/actions/eventActions.ts-529-
src/lib/actions/eventActions.ts:530:export async function removeParticipant(eventId: string, userId: string) {
src/lib/actions/eventActions.ts-531-  try {
src/lib/actions/eventActions.ts-532-    // Check if the participant exists
src/lib/actions/eventActions.ts-533-    const existingParticipant = await db.eventParticipant.findUnique({
src/lib/actions/eventActions.ts-534-      where: {
src/lib/actions/eventActions.ts-535-        eventId_userId: {
--
src/lib/actions/eventActions.ts-563-}
src/lib/actions/eventActions.ts-564-
src/lib/actions/eventActions.ts:565:export async function markAttendance(eventId: string, userId: string, attended: boolean) {
src/lib/actions/eventActions.ts-566-  try {
src/lib/actions/eventActions.ts-567-    // Check if the participant exists
src/lib/actions/eventActions.ts-568-    const existingParticipant = await db.eventParticipant.findUnique({
src/lib/actions/eventActions.ts-569-      where: {
src/lib/actions/eventActions.ts-570-        eventId_userId: {
--
src/lib/actions/eventActions.ts-598-}
src/lib/actions/eventActions.ts-599-
src/lib/actions/eventActions.ts:600:export async function getUpcomingEvents(limit: number = 5) {
src/lib/actions/eventActions.ts-601-  try {
src/lib/actions/eventActions.ts-602-    const now = new Date();
src/lib/actions/eventActions.ts-603-
src/lib/actions/eventActions.ts-604-    // Get upcoming events
src/lib/actions/eventActions.ts-605-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/eventActions.ts-632-}
src/lib/actions/eventActions.ts-633-
src/lib/actions/eventActions.ts:634:export async function getEventParticipants(eventId: string) {
src/lib/actions/eventActions.ts-635-  try {
src/lib/actions/eventActions.ts-636-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/eventActions.ts-637-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/eventActions.ts-638-
src/lib/actions/eventActions.ts-639-    // Verify event belongs to school (indirectly secure or check explicitly)
--
src/lib/actions/student-document-actions.ts-55- * Get student documents
src/lib/actions/student-document-actions.ts-56- */
src/lib/actions/student-document-actions.ts:57:export async function getStudentDocuments() {
src/lib/actions/student-document-actions.ts-58-  const result = await getCurrentStudent();
src/lib/actions/student-document-actions.ts-59-
src/lib/actions/student-document-actions.ts-60-  if (!result) {
src/lib/actions/student-document-actions.ts-61-    redirect("/login");
src/lib/actions/student-document-actions.ts-62-  }
--
src/lib/actions/student-document-actions.ts-125- * Upload a document
src/lib/actions/student-document-actions.ts-126- */
src/lib/actions/student-document-actions.ts:127:export async function uploadDocument(values: DocumentUploadValues) {
src/lib/actions/student-document-actions.ts-128-  const result = await getCurrentStudent();
src/lib/actions/student-document-actions.ts-129-
src/lib/actions/student-document-actions.ts-130-  if (!result) {
src/lib/actions/student-document-actions.ts-131-    return { success: false, message: "Authentication required" };
src/lib/actions/student-document-actions.ts-132-  }
--
src/lib/actions/student-document-actions.ts-176- * Delete a document
src/lib/actions/student-document-actions.ts-177- */
src/lib/actions/student-document-actions.ts:178:export async function deleteDocument(documentId: string) {
src/lib/actions/student-document-actions.ts-179-  const result = await getCurrentStudent();
src/lib/actions/student-document-actions.ts-180-
src/lib/actions/student-document-actions.ts-181-  if (!result) {
src/lib/actions/student-document-actions.ts-182-    return { success: false, message: "Authentication required" };
src/lib/actions/student-document-actions.ts-183-  }
--
src/lib/actions/student-document-actions.ts-219- * Get document categories
src/lib/actions/student-document-actions.ts-220- */
src/lib/actions/student-document-actions.ts:221:export async function getDocumentCategories() {
src/lib/actions/student-document-actions.ts-222-  // Verify the user is a student
src/lib/actions/student-document-actions.ts-223-  const result = await getCurrentStudent();
src/lib/actions/student-document-actions.ts-224-
src/lib/actions/student-document-actions.ts-225-  if (!result) {
src/lib/actions/student-document-actions.ts-226-    redirect("/login");
--
src/lib/actions/billing-actions.ts-5-import { subDays, startOfMonth, endOfMonth, format } from "date-fns";
src/lib/actions/billing-actions.ts-6-
src/lib/actions/billing-actions.ts:7:export async function getBillingDashboardData(timeRange: string = "30d") {
src/lib/actions/billing-actions.ts-8-  await requireSuperAdminAccess();
src/lib/actions/billing-actions.ts-9-
src/lib/actions/billing-actions.ts-10-  const now = new Date();
src/lib/actions/billing-actions.ts-11-  let startDate: Date;
src/lib/actions/billing-actions.ts-12-  let endDate = now;
--
src/lib/actions/billing-actions.ts-222-}
src/lib/actions/billing-actions.ts-223-
src/lib/actions/billing-actions.ts:224:export async function getPaymentHistory(limit: number = 50) {
src/lib/actions/billing-actions.ts-225-  await requireSuperAdminAccess();
src/lib/actions/billing-actions.ts-226-
src/lib/actions/billing-actions.ts-227-  try {
src/lib/actions/billing-actions.ts-228-    // Since we don't have actual payment records yet, we'll use subscription data
src/lib/actions/billing-actions.ts-229-    const subscriptions = await db.subscription.findMany({
--
src/lib/actions/parent-event-actions.ts-74- * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
src/lib/actions/parent-event-actions.ts-75- */
src/lib/actions/parent-event-actions.ts:76:export async function getEvents(filters?: EventFilter) {
src/lib/actions/parent-event-actions.ts-77-  try {
src/lib/actions/parent-event-actions.ts-78-    // Get current parent
src/lib/actions/parent-event-actions.ts-79-    const parent = await getCurrentParent();
src/lib/actions/parent-event-actions.ts-80-    if (!parent) {
src/lib/actions/parent-event-actions.ts-81-      return { success: false, message: "Unauthorized", data: [] };
--
src/lib/actions/parent-event-actions.ts-159- * Requirements: 8.2, 8.3
src/lib/actions/parent-event-actions.ts-160- */
src/lib/actions/parent-event-actions.ts:161:export async function registerForEvent(data: EventRegistration, schoolId: string) {
src/lib/actions/parent-event-actions.ts-162-  try {
src/lib/actions/parent-event-actions.ts-163-    // Validate input
src/lib/actions/parent-event-actions.ts-164-    const validated = eventRegistrationSchema.parse(data);
src/lib/actions/parent-event-actions.ts-165-    
src/lib/actions/parent-event-actions.ts-166-    // Get current parent
--
src/lib/actions/parent-event-actions.ts-281- * Requirements: 8.3
src/lib/actions/parent-event-actions.ts-282- */
src/lib/actions/parent-event-actions.ts:283:export async function cancelEventRegistration(registrationId: string, schoolId: string) {
src/lib/actions/parent-event-actions.ts-284-  try {
src/lib/actions/parent-event-actions.ts-285-    // Get current parent
src/lib/actions/parent-event-actions.ts-286-    const parent = await getCurrentParent();
src/lib/actions/parent-event-actions.ts-287-    if (!parent) {
src/lib/actions/parent-event-actions.ts-288-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-event-actions.ts-353- * Requirements: 8.4, 8.5
src/lib/actions/parent-event-actions.ts-354- */
src/lib/actions/parent-event-actions.ts:355:export async function getRegisteredEvents(childId: string) {
src/lib/actions/parent-event-actions.ts-356-  try {
src/lib/actions/parent-event-actions.ts-357-    // Get current parent
src/lib/actions/parent-event-actions.ts-358-    const parent = await getCurrentParent();
src/lib/actions/parent-event-actions.ts-359-    if (!parent) {
src/lib/actions/parent-event-actions.ts-360-      return { success: false, message: "Unauthorized", data: [] };
--
src/lib/actions/parent-event-actions.ts-421- * Requirements: 8.1, 8.2
src/lib/actions/parent-event-actions.ts-422- */
src/lib/actions/parent-event-actions.ts:423:export async function getEventDetails(eventId: string, childId?: string) {
src/lib/actions/parent-event-actions.ts-424-  try {
src/lib/actions/parent-event-actions.ts-425-    // Get current parent
src/lib/actions/parent-event-actions.ts-426-    const parent = await getCurrentParent();
src/lib/actions/parent-event-actions.ts-427-    if (!parent) {
src/lib/actions/parent-event-actions.ts-428-      return { success: false, message: "Unauthorized", data: null };
--
src/lib/actions/parent-event-actions.ts-491- * Requirements: 8.1, 8.5
src/lib/actions/parent-event-actions.ts-492- */
src/lib/actions/parent-event-actions.ts:493:export async function getUpcomingEvents(limit: number = 5) {
src/lib/actions/parent-event-actions.ts-494-  try {
src/lib/actions/parent-event-actions.ts-495-    // Get current parent
src/lib/actions/parent-event-actions.ts-496-    const parent = await getCurrentParent();
src/lib/actions/parent-event-actions.ts-497-    if (!parent) {
src/lib/actions/parent-event-actions.ts-498-      return { success: false, message: "Unauthorized", data: [] };
--
src/lib/actions/parent-event-actions.ts-536- * Requirements: 8.1, 8.4
src/lib/actions/parent-event-actions.ts-537- */
src/lib/actions/parent-event-actions.ts:538:export async function getEventTypes() {
src/lib/actions/parent-event-actions.ts-539-  try {
src/lib/actions/parent-event-actions.ts-540-    // Get current parent
src/lib/actions/parent-event-actions.ts-541-    const parent = await getCurrentParent();
src/lib/actions/parent-event-actions.ts-542-    if (!parent) {
src/lib/actions/parent-event-actions.ts-543-      return { success: false, message: "Unauthorized", data: [] };
--
src/lib/actions/parent-actions.ts-41- * Get parent's children information
src/lib/actions/parent-actions.ts-42- */
src/lib/actions/parent-actions.ts:43:export async function getParentChildren() {
src/lib/actions/parent-actions.ts-44-  const result = await getCurrentParent();
src/lib/actions/parent-actions.ts-45-  
src/lib/actions/parent-actions.ts-46-  if (!result) {
src/lib/actions/parent-actions.ts-47-    redirect("/login");
src/lib/actions/parent-actions.ts-48-  }
--
src/lib/actions/parent-actions.ts-98- * Get parent dashboard data
src/lib/actions/parent-actions.ts-99- */
src/lib/actions/parent-actions.ts:100:export async function getParentDashboardData() {
src/lib/actions/parent-actions.ts-101-  const result = await getCurrentParent();
src/lib/actions/parent-actions.ts-102-  
src/lib/actions/parent-actions.ts-103-  if (!result || !result.parent || !result.dbUser) {
src/lib/actions/parent-actions.ts-104-    redirect("/login");
src/lib/actions/parent-actions.ts-105-  }
--
src/lib/actions/parent-actions.ts-301- * Schedule a parent-teacher meeting
src/lib/actions/parent-actions.ts-302- */
src/lib/actions/parent-actions.ts:303:export async function scheduleParentTeacherMeeting(teacherId: string, scheduledDate: Date, title: string, schoolId: string, description?: string) {
src/lib/actions/parent-actions.ts-304-  const result = await getCurrentParent();
src/lib/actions/parent-actions.ts-305-  
src/lib/actions/parent-actions.ts-306-  if (!result || !result.parent) {
src/lib/actions/parent-actions.ts-307-    return { success: false, message: "Authentication required" };
src/lib/actions/parent-actions.ts-308-  }
--
src/lib/actions/parent-actions.ts-366- * Get child's academic performance
src/lib/actions/parent-actions.ts-367- */
src/lib/actions/parent-actions.ts:368:export async function getChildAcademicPerformance(studentId: string) {
src/lib/actions/parent-actions.ts-369-  const result = await getCurrentParent();
src/lib/actions/parent-actions.ts-370-  
src/lib/actions/parent-actions.ts-371-  if (!result || !result.parent) {
src/lib/actions/parent-actions.ts-372-    redirect("/login");
src/lib/actions/parent-actions.ts-373-  }
--
src/lib/actions/whatsappInteractiveActions.ts-37- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-38- */
src/lib/actions/whatsappInteractiveActions.ts:39:export async function sendAttendanceConfirmation(params: {
src/lib/actions/whatsappInteractiveActions.ts-40-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-41-  studentName: string;
src/lib/actions/whatsappInteractiveActions.ts-42-  studentId: string;
src/lib/actions/whatsappInteractiveActions.ts-43-  date: string;
src/lib/actions/whatsappInteractiveActions.ts-44-  status: 'ABSENT' | 'LATE';
--
src/lib/actions/whatsappInteractiveActions.ts-96- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-97- */
src/lib/actions/whatsappInteractiveActions.ts:98:export async function sendAttendanceSummary(params: {
src/lib/actions/whatsappInteractiveActions.ts-99-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-100-  studentName: string;
src/lib/actions/whatsappInteractiveActions.ts-101-  studentId: string;
src/lib/actions/whatsappInteractiveActions.ts-102-  weekStart: string;
src/lib/actions/whatsappInteractiveActions.ts-103-  weekEnd: string;
--
src/lib/actions/whatsappInteractiveActions.ts-166- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-167- */
src/lib/actions/whatsappInteractiveActions.ts:168:export async function sendFeePaymentReminder(params: {
src/lib/actions/whatsappInteractiveActions.ts-169-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-170-  studentName: string;
src/lib/actions/whatsappInteractiveActions.ts-171-  studentId: string;
src/lib/actions/whatsappInteractiveActions.ts-172-  feeType: string;
src/lib/actions/whatsappInteractiveActions.ts-173-  amount: number;
--
src/lib/actions/whatsappInteractiveActions.ts-229- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-230- */
src/lib/actions/whatsappInteractiveActions.ts:231:export async function sendFeePaymentConfirmation(params: {
src/lib/actions/whatsappInteractiveActions.ts-232-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-233-  studentName: string;
src/lib/actions/whatsappInteractiveActions.ts-234-  studentId: string;
src/lib/actions/whatsappInteractiveActions.ts-235-  feeType: string;
src/lib/actions/whatsappInteractiveActions.ts-236-  amount: number;
--
src/lib/actions/whatsappInteractiveActions.ts-294- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-295- */
src/lib/actions/whatsappInteractiveActions.ts:296:export async function sendLeaveApprovalRequest(params: {
src/lib/actions/whatsappInteractiveActions.ts-297-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-298-  applicantName: string;
src/lib/actions/whatsappInteractiveActions.ts-299-  applicantType: 'Student' | 'Teacher';
src/lib/actions/whatsappInteractiveActions.ts-300-  leaveType: string;
src/lib/actions/whatsappInteractiveActions.ts-301-  startDate: string;
--
src/lib/actions/whatsappInteractiveActions.ts-355- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-356- */
src/lib/actions/whatsappInteractiveActions.ts:357:export async function sendLeaveStatusNotification(params: {
src/lib/actions/whatsappInteractiveActions.ts-358-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-359-  applicantName: string;
src/lib/actions/whatsappInteractiveActions.ts-360-  leaveType: string;
src/lib/actions/whatsappInteractiveActions.ts-361-  startDate: string;
src/lib/actions/whatsappInteractiveActions.ts-362-  endDate: string;
--
src/lib/actions/whatsappInteractiveActions.ts-420- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-421- */
src/lib/actions/whatsappInteractiveActions.ts:422:export async function sendAnnouncement(params: {
src/lib/actions/whatsappInteractiveActions.ts-423-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-424-  title: string;
src/lib/actions/whatsappInteractiveActions.ts-425-  message: string;
src/lib/actions/whatsappInteractiveActions.ts-426-  category: string;
src/lib/actions/whatsappInteractiveActions.ts-427-  actionButtons?: Array<{
--
src/lib/actions/whatsappInteractiveActions.ts-479- * @returns Send result
src/lib/actions/whatsappInteractiveActions.ts-480- */
src/lib/actions/whatsappInteractiveActions.ts:481:export async function sendExamReminder(params: {
src/lib/actions/whatsappInteractiveActions.ts-482-  to: string;
src/lib/actions/whatsappInteractiveActions.ts-483-  studentName: string;
src/lib/actions/whatsappInteractiveActions.ts-484-  studentId: string;
src/lib/actions/whatsappInteractiveActions.ts-485-  examName: string;
src/lib/actions/whatsappInteractiveActions.ts-486-  subject: string;
--
src/lib/actions/receiptNotesActions.ts-14- * Add a note to a payment receipt
src/lib/actions/receiptNotesActions.ts-15- */
src/lib/actions/receiptNotesActions.ts:16:export async function addReceiptNote(receiptId: string, note: string) {
src/lib/actions/receiptNotesActions.ts-17-  try {
src/lib/actions/receiptNotesActions.ts-18-    const session = await auth();
src/lib/actions/receiptNotesActions.ts-19-    const userId = session?.user?.id;
src/lib/actions/receiptNotesActions.ts-20-
src/lib/actions/receiptNotesActions.ts-21-    if (!userId) {
--
src/lib/actions/receiptNotesActions.ts-121- * Get all notes for a receipt
src/lib/actions/receiptNotesActions.ts-122- */
src/lib/actions/receiptNotesActions.ts:123:export async function getReceiptNotes(receiptId: string) {
src/lib/actions/receiptNotesActions.ts-124-  try {
src/lib/actions/receiptNotesActions.ts-125-    const session = await auth();
src/lib/actions/receiptNotesActions.ts-126-    const userId = session?.user?.id;
src/lib/actions/receiptNotesActions.ts-127-
src/lib/actions/receiptNotesActions.ts-128-    if (!userId) {
--
src/lib/actions/receiptNotesActions.ts-167- * Delete a note (only by the author or super admin)
src/lib/actions/receiptNotesActions.ts-168- */
src/lib/actions/receiptNotesActions.ts:169:export async function deleteReceiptNote(noteId: string) {
src/lib/actions/receiptNotesActions.ts-170-  try {
src/lib/actions/receiptNotesActions.ts-171-    const session = await auth();
src/lib/actions/receiptNotesActions.ts-172-    const userId = session?.user?.id;
src/lib/actions/receiptNotesActions.ts-173-
src/lib/actions/receiptNotesActions.ts-174-    if (!userId) {
--
src/lib/actions/report-card-generation.ts-41- * @returns Action result with PDF URL
src/lib/actions/report-card-generation.ts-42- */
src/lib/actions/report-card-generation.ts:43:export async function generateSingleReportCard(
src/lib/actions/report-card-generation.ts-44-  studentId: string,
src/lib/actions/report-card-generation.ts-45-  termId: string,
src/lib/actions/report-card-generation.ts-46-  templateId: string
src/lib/actions/report-card-generation.ts-47-): Promise<ActionResult<{ pdfUrl: string; reportCardId: string }>> {
src/lib/actions/report-card-generation.ts-48-  try {
--
src/lib/actions/report-card-generation.ts-156- * @returns Action result with batch PDF URL
src/lib/actions/report-card-generation.ts-157- */
src/lib/actions/report-card-generation.ts:158:export async function generateBatchReportCards(
src/lib/actions/report-card-generation.ts-159-  classId: string,
src/lib/actions/report-card-generation.ts-160-  sectionId: string,
src/lib/actions/report-card-generation.ts-161-  termId: string,
src/lib/actions/report-card-generation.ts-162-  templateId: string
src/lib/actions/report-card-generation.ts-163-): Promise<ActionResult<{ pdfUrl: string; totalGenerated: number }>> {
--
src/lib/actions/report-card-generation.ts-298- * @returns Action result with ZIP file as base64 data
src/lib/actions/report-card-generation.ts-299- */
src/lib/actions/report-card-generation.ts:300:export async function generateBatchReportCardsZip(
src/lib/actions/report-card-generation.ts-301-  classId: string,
src/lib/actions/report-card-generation.ts-302-  sectionId: string,
src/lib/actions/report-card-generation.ts-303-  termId: string,
src/lib/actions/report-card-generation.ts-304-  templateId: string
src/lib/actions/report-card-generation.ts-305-): Promise<ActionResult<{ zipData: string; zipFilename: string; totalGenerated: number; fileList: string[] }>> {
--
src/lib/actions/report-card-generation.ts-488- * @returns List of available templates
src/lib/actions/report-card-generation.ts-489- */
src/lib/actions/report-card-generation.ts:490:export async function getReportCardTemplates(): Promise<ActionResult<any[]>> {
src/lib/actions/report-card-generation.ts-491-  try {
src/lib/actions/report-card-generation.ts-492-    const templates = await db.reportCardTemplate.findMany({
src/lib/actions/report-card-generation.ts-493-      where: { isActive: true },
src/lib/actions/report-card-generation.ts-494-      select: {
src/lib/actions/report-card-generation.ts-495-        id: true,
--
src/lib/actions/report-card-generation.ts-525- * @returns Report card data for preview
src/lib/actions/report-card-generation.ts-526- */
src/lib/actions/report-card-generation.ts:527:export async function previewReportCard(
src/lib/actions/report-card-generation.ts-528-  studentId: string,
src/lib/actions/report-card-generation.ts-529-  termId: string
src/lib/actions/report-card-generation.ts-530-): Promise<ActionResult> {
src/lib/actions/report-card-generation.ts-531-  try {
src/lib/actions/report-card-generation.ts-532-    // Verify authentication
--
src/lib/actions/exportMarksActions.ts-38- * Export marks to Excel or CSV format
src/lib/actions/exportMarksActions.ts-39- */
src/lib/actions/exportMarksActions.ts:40:export async function exportMarksToFile(
src/lib/actions/exportMarksActions.ts-41-  input: ExportMarksInput
src/lib/actions/exportMarksActions.ts-42-): Promise<ExportResult> {
src/lib/actions/exportMarksActions.ts-43-  try {
src/lib/actions/exportMarksActions.ts-44-    // CRITICAL: Add school isolation
src/lib/actions/exportMarksActions.ts-45-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
--
src/lib/actions/exportMarksActions.ts-337- * Get available exams for export
src/lib/actions/exportMarksActions.ts-338- */
src/lib/actions/exportMarksActions.ts:339:export async function getExamsForExport() {
src/lib/actions/exportMarksActions.ts-340-  try {
src/lib/actions/exportMarksActions.ts-341-    // CRITICAL: Add school isolation
src/lib/actions/exportMarksActions.ts-342-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/exportMarksActions.ts-343-    const schoolId = await getRequiredSchoolId();
src/lib/actions/exportMarksActions.ts-344-
--
src/lib/actions/administratorActions.ts-5-
src/lib/actions/administratorActions.ts-6-// Get administrator with detailed information
src/lib/actions/administratorActions.ts:7:export async function getAdministratorWithDetails(administratorId: string) {
src/lib/actions/administratorActions.ts-8-  const session = await auth();
src/lib/actions/administratorActions.ts-9-  if (!session?.user?.id) return null;
src/lib/actions/administratorActions.ts-10-  if (!administratorId) {
src/lib/actions/administratorActions.ts-11-    console.error('Invalid administrator ID provided:', administratorId);
src/lib/actions/administratorActions.ts-12-    return null;
--
src/lib/actions/assignmentsActions.ts-18-
src/lib/actions/assignmentsActions.ts-19-// Get all assignments with optional filtering
src/lib/actions/assignmentsActions.ts:20:export async function getAssignments(filters?: AssignmentFilterValues) {
src/lib/actions/assignmentsActions.ts-21-  try {
src/lib/actions/assignmentsActions.ts-22-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-23-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-24-    const where: any = { schoolId };
src/lib/actions/assignmentsActions.ts-25-
--
src/lib/actions/assignmentsActions.ts-154-
src/lib/actions/assignmentsActions.ts-155-// Get a single assignment by ID
src/lib/actions/assignmentsActions.ts:156:export async function getAssignmentById(id: string) {
src/lib/actions/assignmentsActions.ts-157-  try {
src/lib/actions/assignmentsActions.ts-158-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-159-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-160-    const assignment = await db.assignment.findUnique({
src/lib/actions/assignmentsActions.ts-161-      where: { id, schoolId },
--
src/lib/actions/assignmentsActions.ts-283-
src/lib/actions/assignmentsActions.ts-284-// Create a new assignment
src/lib/actions/assignmentsActions.ts:285:export async function createAssignment(data: AssignmentFormValues, creatorId: string | null = null, files?: File[]) {
src/lib/actions/assignmentsActions.ts-286-  try {
src/lib/actions/assignmentsActions.ts-287-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-288-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-289-    // Handle file uploads if provided
src/lib/actions/assignmentsActions.ts-290-    const attachments: string[] = [];
--
src/lib/actions/assignmentsActions.ts-380-
src/lib/actions/assignmentsActions.ts-381-// Update an existing assignment
src/lib/actions/assignmentsActions.ts:382:export async function updateAssignment(data: AssignmentUpdateValues, files?: File[]) {
src/lib/actions/assignmentsActions.ts-383-  try {
src/lib/actions/assignmentsActions.ts-384-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-385-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-386-    // Check if assignment exists
src/lib/actions/assignmentsActions.ts-387-    const existingAssignment = await db.assignment.findUnique({
--
src/lib/actions/assignmentsActions.ts-494-
src/lib/actions/assignmentsActions.ts-495-// Delete an assignment
src/lib/actions/assignmentsActions.ts:496:export async function deleteAssignment(id: string) {
src/lib/actions/assignmentsActions.ts-497-  try {
src/lib/actions/assignmentsActions.ts-498-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-499-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-500-    // Check if assignment has submissions
src/lib/actions/assignmentsActions.ts-501-    const submissions = await db.assignmentSubmission.findMany({
--
src/lib/actions/assignmentsActions.ts-535-
src/lib/actions/assignmentsActions.ts-536-// Get all submissions for an assignment
src/lib/actions/assignmentsActions.ts:537:export async function getSubmissionsByAssignment(assignmentId: string) {
src/lib/actions/assignmentsActions.ts-538-  try {
src/lib/actions/assignmentsActions.ts-539-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-540-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-541-    const assignment = await db.assignment.findUnique({
src/lib/actions/assignmentsActions.ts-542-      where: { id: assignmentId, schoolId },
--
src/lib/actions/assignmentsActions.ts-598-
src/lib/actions/assignmentsActions.ts-599-// Grade a submission
src/lib/actions/assignmentsActions.ts:600:export async function gradeSubmission(data: SubmissionGradeValues) {
src/lib/actions/assignmentsActions.ts-601-  try {
src/lib/actions/assignmentsActions.ts-602-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-603-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-604-    const submission = await db.assignmentSubmission.findUnique({
src/lib/actions/assignmentsActions.ts-605-      where: { id: data.submissionId },
--
src/lib/actions/assignmentsActions.ts-643-
src/lib/actions/assignmentsActions.ts-644-// Get subjects for assignment dropdown
src/lib/actions/assignmentsActions.ts:645:export async function getSubjectsForAssignments() {
src/lib/actions/assignmentsActions.ts-646-  try {
src/lib/actions/assignmentsActions.ts-647-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-648-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-649-    const subjects = await db.subject.findMany({
src/lib/actions/assignmentsActions.ts-650-      where: { schoolId },
--
src/lib/actions/assignmentsActions.ts-670-
src/lib/actions/assignmentsActions.ts-671-// Get classes for assignment dropdown
src/lib/actions/assignmentsActions.ts:672:export async function getClassesForAssignments() {
src/lib/actions/assignmentsActions.ts-673-  try {
src/lib/actions/assignmentsActions.ts-674-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assignmentsActions.ts-675-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assignmentsActions.ts-676-    const classes = await db.class.findMany({
src/lib/actions/assignmentsActions.ts-677-      where: { schoolId },
--
src/lib/actions/studentActions.ts-12-
src/lib/actions/studentActions.ts-13-// Get student with detailed information
src/lib/actions/studentActions.ts:14:export async function getStudentWithDetails(studentId: string) {
src/lib/actions/studentActions.ts-15-  if (!studentId) {
src/lib/actions/studentActions.ts-16-    console.error('Invalid student ID provided:', studentId);
src/lib/actions/studentActions.ts-17-    return null;
src/lib/actions/studentActions.ts-18-  }
src/lib/actions/studentActions.ts-19-
--
src/lib/actions/studentActions.ts-99- * Upload student profile photo (requires STUDENT:UPDATE permission)
src/lib/actions/studentActions.ts-100- */
src/lib/actions/studentActions.ts:101:export async function uploadStudentAvatar(formData: FormData) {
src/lib/actions/studentActions.ts-102-  try {
src/lib/actions/studentActions.ts-103-    const session = await auth();
src/lib/actions/studentActions.ts-104-    const currentUserId = session?.user?.id;
src/lib/actions/studentActions.ts-105-
src/lib/actions/studentActions.ts-106-    if (!currentUserId) {
--
src/lib/actions/studentActions.ts-242- * Remove student profile photo (requires STUDENT:UPDATE permission)
src/lib/actions/studentActions.ts-243- */
src/lib/actions/studentActions.ts:244:export async function removeStudentAvatar(studentId: string) {
src/lib/actions/studentActions.ts-245-  try {
src/lib/actions/studentActions.ts-246-    const session = await auth();
src/lib/actions/studentActions.ts-247-    const currentUserId = session?.user?.id;
src/lib/actions/studentActions.ts-248-
src/lib/actions/studentActions.ts-249-    if (!currentUserId) {
--
src/lib/actions/teacherTimetableActions.ts-9- * Get teacher's timetable for the current active timetable
src/lib/actions/teacherTimetableActions.ts-10- */
src/lib/actions/teacherTimetableActions.ts:11:export async function getTeacherTimetable() {
src/lib/actions/teacherTimetableActions.ts-12-  try {
src/lib/actions/teacherTimetableActions.ts-13-    // Add school isolation
src/lib/actions/teacherTimetableActions.ts-14-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherTimetableActions.ts-15-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherTimetableActions.ts-16-
--
src/lib/actions/teacherTimetableActions.ts-149- * Get teacher's timetable for a specific day
src/lib/actions/teacherTimetableActions.ts-150- */
src/lib/actions/teacherTimetableActions.ts:151:export async function getTeacherDayTimetable(day: DayOfWeek) {
src/lib/actions/teacherTimetableActions.ts-152-  try {
src/lib/actions/teacherTimetableActions.ts-153-    const { timetable, slots, weekdays, config } = await getTeacherTimetable();
src/lib/actions/teacherTimetableActions.ts-154-
src/lib/actions/teacherTimetableActions.ts-155-    const daySlots = slots.filter(slot => slot.day === day);
src/lib/actions/teacherTimetableActions.ts-156-
--
src/lib/actions/teacherTimetableActions.ts-182- * Extract time slots from timetable configuration
src/lib/actions/teacherTimetableActions.ts-183- */
src/lib/actions/teacherTimetableActions.ts:184:export async function getTimeSlots() {
src/lib/actions/teacherTimetableActions.ts-185-  try {
src/lib/actions/teacherTimetableActions.ts-186-    // Add school isolation
src/lib/actions/teacherTimetableActions.ts-187-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherTimetableActions.ts-188-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherTimetableActions.ts-189-
--
src/lib/actions/transportAttendanceActions.ts-36-
src/lib/actions/transportAttendanceActions.ts-37-// Record transport attendance for a single student
src/lib/actions/transportAttendanceActions.ts:38:export async function recordTransportAttendance(data: TransportAttendanceFormValues) {
src/lib/actions/transportAttendanceActions.ts-39-  try {
src/lib/actions/transportAttendanceActions.ts-40-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/transportAttendanceActions.ts-41-    
src/lib/actions/transportAttendanceActions.ts-42-    if (!schoolId) {
src/lib/actions/transportAttendanceActions.ts-43-      throw new Error("School access required");
--
src/lib/actions/transportAttendanceActions.ts-164-
src/lib/actions/transportAttendanceActions.ts-165-// Record bulk transport attendance for multiple students at a stop
src/lib/actions/transportAttendanceActions.ts:166:export async function recordBulkTransportAttendance(data: BulkTransportAttendanceFormValues) {
src/lib/actions/transportAttendanceActions.ts-167-  try {
src/lib/actions/transportAttendanceActions.ts-168-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/transportAttendanceActions.ts-169-    
src/lib/actions/transportAttendanceActions.ts-170-    if (!schoolId) {
src/lib/actions/transportAttendanceActions.ts-171-      throw new Error("School access required");
--
src/lib/actions/transportAttendanceActions.ts-272-
src/lib/actions/transportAttendanceActions.ts-273-// Get transport attendance for a specific route and date
src/lib/actions/transportAttendanceActions.ts:274:export async function getTransportAttendanceByRouteAndDate(
src/lib/actions/transportAttendanceActions.ts-275-  routeId: string,
src/lib/actions/transportAttendanceActions.ts-276-  date: Date,
src/lib/actions/transportAttendanceActions.ts-277-  attendanceType?: "BOARDING" | "ALIGHTING",
src/lib/actions/transportAttendanceActions.ts-278-  stopName?: string
src/lib/actions/transportAttendanceActions.ts-279-) {
--
src/lib/actions/transportAttendanceActions.ts-334-
src/lib/actions/transportAttendanceActions.ts-335-// Get transport attendance for a specific student
src/lib/actions/transportAttendanceActions.ts:336:export async function getStudentTransportAttendance(
src/lib/actions/transportAttendanceActions.ts-337-  studentId: string,
src/lib/actions/transportAttendanceActions.ts-338-  params?: {
src/lib/actions/transportAttendanceActions.ts-339-    startDate?: Date;
src/lib/actions/transportAttendanceActions.ts-340-    endDate?: Date;
src/lib/actions/transportAttendanceActions.ts-341-    attendanceType?: "BOARDING" | "ALIGHTING";
--
src/lib/actions/transportAttendanceActions.ts-400-
src/lib/actions/transportAttendanceActions.ts-401-// Get transport attendance statistics for a route
src/lib/actions/transportAttendanceActions.ts:402:export async function getRouteAttendanceStats(
src/lib/actions/transportAttendanceActions.ts-403-  routeId: string,
src/lib/actions/transportAttendanceActions.ts-404-  startDate: Date,
src/lib/actions/transportAttendanceActions.ts-405-  endDate: Date
src/lib/actions/transportAttendanceActions.ts-406-) {
src/lib/actions/transportAttendanceActions.ts-407-  try {
--
src/lib/actions/transportAttendanceActions.ts-509-
src/lib/actions/transportAttendanceActions.ts-510-// Delete transport attendance record
src/lib/actions/transportAttendanceActions.ts:511:export async function deleteTransportAttendance(id: string) {
src/lib/actions/transportAttendanceActions.ts-512-  try {
src/lib/actions/transportAttendanceActions.ts-513-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/transportAttendanceActions.ts-514-    
src/lib/actions/transportAttendanceActions.ts-515-    if (!schoolId) {
src/lib/actions/transportAttendanceActions.ts-516-      throw new Error("School access required");
--
src/lib/actions/transportAttendanceActions.ts-550-
src/lib/actions/transportAttendanceActions.ts-551-// Get today's transport attendance summary for all routes
src/lib/actions/transportAttendanceActions.ts:552:export async function getTodayTransportAttendanceSummary() {
src/lib/actions/transportAttendanceActions.ts-553-  try {
src/lib/actions/transportAttendanceActions.ts-554-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/transportAttendanceActions.ts-555-    
src/lib/actions/transportAttendanceActions.ts-556-    if (!schoolId) {
src/lib/actions/transportAttendanceActions.ts-557-      throw new Error("School access required");
--
src/lib/actions/backupActions.ts-27- * @param notifyOnFailure - Whether to send email notifications on backup failure (Requirements: 9.5)
src/lib/actions/backupActions.ts-28- */
src/lib/actions/backupActions.ts:29:export async function createBackupAction(notifyOnFailure: boolean = true) {
src/lib/actions/backupActions.ts-30-  try {
src/lib/actions/backupActions.ts-31-    const session = await auth();
src/lib/actions/backupActions.ts-32-    const userId = session?.user?.id;
src/lib/actions/backupActions.ts-33-
src/lib/actions/backupActions.ts-34-    if (!userId) {
--
src/lib/actions/backupActions.ts-86- * Only accessible by administrators
src/lib/actions/backupActions.ts-87- */
src/lib/actions/backupActions.ts:88:export async function restoreBackupAction(backupId: string) {
src/lib/actions/backupActions.ts-89-  try {
src/lib/actions/backupActions.ts-90-    const session = await auth();
src/lib/actions/backupActions.ts-91-    const userId = session?.user?.id;
src/lib/actions/backupActions.ts-92-
src/lib/actions/backupActions.ts-93-    if (!userId) {
--
src/lib/actions/backupActions.ts-144- * Only accessible by administrators
src/lib/actions/backupActions.ts-145- */
src/lib/actions/backupActions.ts:146:export async function listBackupsAction() {
src/lib/actions/backupActions.ts-147-  try {
src/lib/actions/backupActions.ts-148-    const session = await auth();
src/lib/actions/backupActions.ts-149-    const userId = session?.user?.id;
src/lib/actions/backupActions.ts-150-
src/lib/actions/backupActions.ts-151-    if (!userId) {
--
src/lib/actions/backupActions.ts-187- * Only accessible by administrators
src/lib/actions/backupActions.ts-188- */
src/lib/actions/backupActions.ts:189:export async function deleteBackupAction(backupId: string) {
src/lib/actions/backupActions.ts-190-  try {
src/lib/actions/backupActions.ts-191-    const session = await auth();
src/lib/actions/backupActions.ts-192-    const userId = session?.user?.id;
src/lib/actions/backupActions.ts-193-
src/lib/actions/backupActions.ts-194-    if (!userId) {
--
src/lib/actions/backupActions.ts-242- * Only accessible by administrators
src/lib/actions/backupActions.ts-243- */
src/lib/actions/backupActions.ts:244:export async function uploadBackupToCloudAction(backupId: string, localPath: string) {
src/lib/actions/backupActions.ts-245-  try {
src/lib/actions/backupActions.ts-246-    const session = await auth();
src/lib/actions/backupActions.ts-247-    const userId = session?.user?.id;
src/lib/actions/backupActions.ts-248-
src/lib/actions/backupActions.ts-249-    if (!userId) {
--
src/lib/actions/backupActions.ts-301- * Requirements: 9.2 - Backup download to local storage
src/lib/actions/backupActions.ts-302- */
src/lib/actions/backupActions.ts:303:export async function downloadBackupAction(backupId: string): Promise<{
src/lib/actions/backupActions.ts-304-  success: boolean;
src/lib/actions/backupActions.ts-305-  data?: {
src/lib/actions/backupActions.ts-306-    base64: string;
src/lib/actions/backupActions.ts-307-    filename: string;
src/lib/actions/backupActions.ts-308-    size: number;
--
src/lib/actions/messageAnalyticsActions.ts-112- * @returns Analytics summary
src/lib/actions/messageAnalyticsActions.ts-113- */
src/lib/actions/messageAnalyticsActions.ts:114:export async function getMessageAnalytics(
src/lib/actions/messageAnalyticsActions.ts-115-  params: MessageAnalyticsParams = {}
src/lib/actions/messageAnalyticsActions.ts-116-): Promise<AnalyticsSummary> {
src/lib/actions/messageAnalyticsActions.ts-117-  try {
src/lib/actions/messageAnalyticsActions.ts-118-    await checkAuthorization();
src/lib/actions/messageAnalyticsActions.ts-119-
--
src/lib/actions/messageAnalyticsActions.ts-193- * @returns Time series data grouped by date
src/lib/actions/messageAnalyticsActions.ts-194- */
src/lib/actions/messageAnalyticsActions.ts:195:export async function getMessageTimeSeriesData(
src/lib/actions/messageAnalyticsActions.ts-196-  params: MessageAnalyticsParams = {}
src/lib/actions/messageAnalyticsActions.ts-197-): Promise<TimeSeriesData[]> {
src/lib/actions/messageAnalyticsActions.ts-198-  try {
src/lib/actions/messageAnalyticsActions.ts-199-    await checkAuthorization();
src/lib/actions/messageAnalyticsActions.ts-200-
--
src/lib/actions/messageAnalyticsActions.ts-266- * @returns Cost comparison across channels
src/lib/actions/messageAnalyticsActions.ts-267- */
src/lib/actions/messageAnalyticsActions.ts:268:export async function getCostComparisonData(
src/lib/actions/messageAnalyticsActions.ts-269-  messageLength: number = 160,
src/lib/actions/messageAnalyticsActions.ts-270-  recipientCount: number = 1
src/lib/actions/messageAnalyticsActions.ts-271-): Promise<CostComparison[]> {
src/lib/actions/messageAnalyticsActions.ts-272-  try {
src/lib/actions/messageAnalyticsActions.ts-273-    await checkAuthorization();
--
src/lib/actions/messageAnalyticsActions.ts-289- * @returns Cost savings data
src/lib/actions/messageAnalyticsActions.ts-290- */
src/lib/actions/messageAnalyticsActions.ts:291:export async function getCostSavingsAnalysis(
src/lib/actions/messageAnalyticsActions.ts-292-  fromChannel: CommunicationChannel,
src/lib/actions/messageAnalyticsActions.ts-293-  toChannel: CommunicationChannel,
src/lib/actions/messageAnalyticsActions.ts-294-  messageCount: number
src/lib/actions/messageAnalyticsActions.ts-295-): Promise<{
src/lib/actions/messageAnalyticsActions.ts-296-  savings: number;
--
src/lib/actions/messageAnalyticsActions.ts-315- * @returns All channel pricing configurations
src/lib/actions/messageAnalyticsActions.ts-316- */
src/lib/actions/messageAnalyticsActions.ts:317:export async function getChannelPricingInfo() {
src/lib/actions/messageAnalyticsActions.ts-318-  try {
src/lib/actions/messageAnalyticsActions.ts-319-    await checkAuthorization();
src/lib/actions/messageAnalyticsActions.ts-320-
src/lib/actions/messageAnalyticsActions.ts-321-    return getAllChannelPricing();
src/lib/actions/messageAnalyticsActions.ts-322-  } catch (error: any) {
--
src/lib/actions/messageAnalyticsActions.ts-333- * @returns Export data with logs and summary
src/lib/actions/messageAnalyticsActions.ts-334- */
src/lib/actions/messageAnalyticsActions.ts:335:export async function exportAnalyticsData(
src/lib/actions/messageAnalyticsActions.ts-336-  params: MessageAnalyticsParams = {}
src/lib/actions/messageAnalyticsActions.ts-337-): Promise<ExportData> {
src/lib/actions/messageAnalyticsActions.ts-338-  try {
src/lib/actions/messageAnalyticsActions.ts-339-    await checkAuthorization();
src/lib/actions/messageAnalyticsActions.ts-340-
--
src/lib/actions/messageAnalyticsActions.ts-378- * @returns Statistics grouped by status
src/lib/actions/messageAnalyticsActions.ts-379- */
src/lib/actions/messageAnalyticsActions.ts:380:export async function getDeliveryStatistics(
src/lib/actions/messageAnalyticsActions.ts-381-  params: MessageAnalyticsParams = {}
src/lib/actions/messageAnalyticsActions.ts-382-): Promise<Array<{
src/lib/actions/messageAnalyticsActions.ts-383-  status: MessageLogStatus;
src/lib/actions/messageAnalyticsActions.ts-384-  count: number;
src/lib/actions/messageAnalyticsActions.ts-385-  percentage: number;
--
src/lib/actions/onboarding/setup-actions.ts-51- * Check if onboarding has been completed for the current school
src/lib/actions/onboarding/setup-actions.ts-52- */
src/lib/actions/onboarding/setup-actions.ts:53:export async function checkOnboardingStatus() {
src/lib/actions/onboarding/setup-actions.ts-54-    try {
src/lib/actions/onboarding/setup-actions.ts-55-        const schoolId = await getCurrentSchoolId();
src/lib/actions/onboarding/setup-actions.ts-56-
src/lib/actions/onboarding/setup-actions.ts-57-        if (!schoolId) {
src/lib/actions/onboarding/setup-actions.ts-58-            // If no school context, check if system has any schools
--
src/lib/actions/onboarding/setup-actions.ts-106- * Complete the setup wizard - handles both system setup and school setup
src/lib/actions/onboarding/setup-actions.ts-107- */
src/lib/actions/onboarding/setup-actions.ts:108:export async function completeSetup(data: SetupData) {
src/lib/actions/onboarding/setup-actions.ts-109-    console.log("completeSetup called with data:", {
src/lib/actions/onboarding/setup-actions.ts-110-        schoolId: data.schoolId,
src/lib/actions/onboarding/setup-actions.ts-111-        academicYearName: data.academicYearName,
src/lib/actions/onboarding/setup-actions.ts-112-        hasSchoolName: !!data.schoolName,
src/lib/actions/onboarding/setup-actions.ts-113-        hasAdminEmail: !!data.adminEmail
--
src/lib/actions/onboarding/setup-actions.ts-667- * Enhanced to work with detailed progress tracking (Task 9.5)
src/lib/actions/onboarding/setup-actions.ts-668- */
src/lib/actions/onboarding/setup-actions.ts:669:export async function updateOnboardingStep(step: number, metadata?: Record<string, any>) {
src/lib/actions/onboarding/setup-actions.ts-670-    try {
src/lib/actions/onboarding/setup-actions.ts-671-        const schoolId = await getCurrentSchoolId();
src/lib/actions/onboarding/setup-actions.ts-672-
src/lib/actions/onboarding/setup-actions.ts-673-        if (!schoolId) {
src/lib/actions/onboarding/setup-actions.ts-674-            return { success: false, error: "No school context found" };
--
src/lib/actions/lmsActions.ts-8-// Course Management Actions
src/lib/actions/lmsActions.ts-9-
src/lib/actions/lmsActions.ts:10:export async function createCourse(data: {
src/lib/actions/lmsActions.ts-11-  title: string;
src/lib/actions/lmsActions.ts-12-  description?: string;
src/lib/actions/lmsActions.ts-13-  subjectId?: string;
src/lib/actions/lmsActions.ts-14-  classId?: string;
src/lib/actions/lmsActions.ts-15-  thumbnail?: string;
--
src/lib/actions/lmsActions.ts-61-}
src/lib/actions/lmsActions.ts-62-
src/lib/actions/lmsActions.ts:63:export async function updateCourse(
src/lib/actions/lmsActions.ts-64-  courseId: string,
src/lib/actions/lmsActions.ts-65-  data: {
src/lib/actions/lmsActions.ts-66-    title?: string;
src/lib/actions/lmsActions.ts-67-    description?: string;
src/lib/actions/lmsActions.ts-68-    subjectId?: string;
--
src/lib/actions/lmsActions.ts-110-}
src/lib/actions/lmsActions.ts-111-
src/lib/actions/lmsActions.ts:112:export async function publishCourse(courseId: string) {
src/lib/actions/lmsActions.ts-113-  try {
src/lib/actions/lmsActions.ts-114-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-115-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-116-
src/lib/actions/lmsActions.ts-117-    // Verify ownership
--
src/lib/actions/lmsActions.ts-142-}
src/lib/actions/lmsActions.ts-143-
src/lib/actions/lmsActions.ts:144:export async function deleteCourse(courseId: string) {
src/lib/actions/lmsActions.ts-145-  try {
src/lib/actions/lmsActions.ts-146-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-147-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-148-
src/lib/actions/lmsActions.ts-149-    // Verify ownership
--
src/lib/actions/lmsActions.ts-168-}
src/lib/actions/lmsActions.ts-169-
src/lib/actions/lmsActions.ts:170:export async function getCourses(filters?: {
src/lib/actions/lmsActions.ts-171-  teacherId?: string;
src/lib/actions/lmsActions.ts-172-  subjectId?: string;
src/lib/actions/lmsActions.ts-173-  classId?: string;
src/lib/actions/lmsActions.ts-174-  status?: string;
src/lib/actions/lmsActions.ts-175-  isPublished?: boolean;
--
src/lib/actions/lmsActions.ts-223-}
src/lib/actions/lmsActions.ts-224-
src/lib/actions/lmsActions.ts:225:export async function getCourseById(courseId: string) {
src/lib/actions/lmsActions.ts-226-  try {
src/lib/actions/lmsActions.ts-227-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-228-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-229-
src/lib/actions/lmsActions.ts-230-    const course = await prisma.course.findFirst({
--
src/lib/actions/lmsActions.ts-273-// Module Management Actions
src/lib/actions/lmsActions.ts-274-
src/lib/actions/lmsActions.ts:275:export async function createModule(data: {
src/lib/actions/lmsActions.ts-276-  courseId: string;
src/lib/actions/lmsActions.ts-277-  title: string;
src/lib/actions/lmsActions.ts-278-  description?: string;
src/lib/actions/lmsActions.ts-279-  sequence: number;
src/lib/actions/lmsActions.ts-280-  duration?: number;
--
src/lib/actions/lmsActions.ts-307-}
src/lib/actions/lmsActions.ts-308-
src/lib/actions/lmsActions.ts:309:export async function updateLesson(
src/lib/actions/lmsActions.ts-310-  lessonId: string,
src/lib/actions/lmsActions.ts-311-  data: {
src/lib/actions/lmsActions.ts-312-    title?: string;
src/lib/actions/lmsActions.ts-313-    description?: string;
src/lib/actions/lmsActions.ts-314-    sequence?: number;
--
src/lib/actions/lmsActions.ts-345-}
src/lib/actions/lmsActions.ts-346-
src/lib/actions/lmsActions.ts:347:export async function deleteLesson(lessonId: string) {
src/lib/actions/lmsActions.ts-348-  try {
src/lib/actions/lmsActions.ts-349-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-350-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-351-
src/lib/actions/lmsActions.ts-352-    const lesson = await prisma.courseLesson.findFirst({
--
src/lib/actions/lmsActions.ts-375-// Content Management Actions
src/lib/actions/lmsActions.ts-376-
src/lib/actions/lmsActions.ts:377:export async function createContent(data: {
src/lib/actions/lmsActions.ts-378-  lessonId: string;
src/lib/actions/lmsActions.ts-379-  contentType: 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'PRESENTATION' | 'IMAGE' | 'TEXT' | 'LINK' | 'EMBED';
src/lib/actions/lmsActions.ts-380-  title?: string;
src/lib/actions/lmsActions.ts-381-  url?: string;
src/lib/actions/lmsActions.ts-382-  content?: string;
--
src/lib/actions/lmsActions.ts-407-}
src/lib/actions/lmsActions.ts-408-
src/lib/actions/lmsActions.ts:409:export async function updateContent(
src/lib/actions/lmsActions.ts-410-  contentId: string,
src/lib/actions/lmsActions.ts-411-  data: {
src/lib/actions/lmsActions.ts-412-    title?: string;
src/lib/actions/lmsActions.ts-413-    url?: string;
src/lib/actions/lmsActions.ts-414-    content?: string;
--
src/lib/actions/lmsActions.ts-440-}
src/lib/actions/lmsActions.ts-441-
src/lib/actions/lmsActions.ts:442:export async function deleteContent(contentId: string) {
src/lib/actions/lmsActions.ts-443-  try {
src/lib/actions/lmsActions.ts-444-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-445-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-446-
src/lib/actions/lmsActions.ts-447-    const existing = await prisma.courseContent.findFirst({
--
src/lib/actions/lmsActions.ts-463-// Enrollment Actions
src/lib/actions/lmsActions.ts-464-
src/lib/actions/lmsActions.ts:465:export async function enrollInCourse(courseId: string) {
src/lib/actions/lmsActions.ts-466-  try {
src/lib/actions/lmsActions.ts-467-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-468-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-469-    const session = await auth();
src/lib/actions/lmsActions.ts-470-    const userId = session?.user?.id;
--
src/lib/actions/lmsActions.ts-530-}
src/lib/actions/lmsActions.ts-531-
src/lib/actions/lmsActions.ts:532:export async function getStudentEnrollments(studentId?: string) {
src/lib/actions/lmsActions.ts-533-  try {
src/lib/actions/lmsActions.ts-534-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/lmsActions.ts-535-    if (!schoolId) throw new Error("School context required");
src/lib/actions/lmsActions.ts-536-    const session = await auth();
src/lib/actions/lmsActions.ts-537-    const userId = session?.user?.id;
--
src/lib/actions/lmsActions.ts-598-// Progress Tracking Actions
src/lib/actions/lmsActions.ts-599-
src/lib/actions/lmsActions.ts:600:export async function updateLessonProgress(data: {
src/lib/actions/lmsActions.ts-601-  enrollmentId: string;
src/lib/actions/lmsActions.ts-602-  lessonId: string;
src/lib/actions/lmsActions.ts-603-  progress: number;
src/lib/actions/lmsActions.ts-604-  timeSpent?: number;
src/lib/actions/lmsActions.ts-605-  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
--
src/lib/actions/lmsActions.ts-709-// Discussion Forum Actions
src/lib/actions/lmsActions.ts-710-
src/lib/actions/lmsActions.ts:711:export async function createDiscussion(data: {
src/lib/actions/lmsActions.ts-712-  courseId: string;
src/lib/actions/lmsActions.ts-713-  title: string;
src/lib/actions/lmsActions.ts-714-  content: string;
src/lib/actions/lmsActions.ts-715-}) {
src/lib/actions/lmsActions.ts-716-  try {
--
src/lib/actions/lmsActions.ts-759-}
src/lib/actions/lmsActions.ts-760-
src/lib/actions/lmsActions.ts:761:export async function replyToDiscussion(data: {
src/lib/actions/lmsActions.ts-762-  discussionId: string;
src/lib/actions/lmsActions.ts-763-  content: string;
src/lib/actions/lmsActions.ts-764-  userType: 'STUDENT' | 'TEACHER';
src/lib/actions/lmsActions.ts-765-}) {
src/lib/actions/lmsActions.ts-766-  try {
--
src/lib/actions/lmsActions.ts-800-}
src/lib/actions/lmsActions.ts-801-
src/lib/actions/lmsActions.ts:802:export async function getDiscussions(courseId: string) {
src/lib/actions/lmsActions.ts-803-  try {
src/lib/actions/lmsActions.ts-804-    const discussions = await prisma.courseDiscussion.findMany({
src/lib/actions/lmsActions.ts-805-      where: { courseId },
src/lib/actions/lmsActions.ts-806-      include: {
src/lib/actions/lmsActions.ts-807-        student: {
--
src/lib/actions/lmsActions.ts-836-// Quiz Actions
src/lib/actions/lmsActions.ts-837-
src/lib/actions/lmsActions.ts:838:export async function createQuiz(data: {
src/lib/actions/lmsActions.ts-839-  lessonId: string;
src/lib/actions/lmsActions.ts-840-  title: string;
src/lib/actions/lmsActions.ts-841-  description?: string;
src/lib/actions/lmsActions.ts-842-  questions: any[];
src/lib/actions/lmsActions.ts-843-  passingScore?: number;
--
src/lib/actions/lmsActions.ts-875-}
src/lib/actions/lmsActions.ts-876-
src/lib/actions/lmsActions.ts:877:export async function submitQuizAttempt(data: {
src/lib/actions/lmsActions.ts-878-  quizId: string;
src/lib/actions/lmsActions.ts-879-  answers: any[];
src/lib/actions/lmsActions.ts-880-  timeSpent?: number;
src/lib/actions/lmsActions.ts-881-}) {
src/lib/actions/lmsActions.ts-882-  try {
--
src/lib/actions/lmsActions.ts-955-}
src/lib/actions/lmsActions.ts-956-
src/lib/actions/lmsActions.ts:957:export async function getQuizAttempts(quizId: string, studentId?: string) {
src/lib/actions/lmsActions.ts-958-  try {
src/lib/actions/lmsActions.ts-959-    const session = await auth();
src/lib/actions/lmsActions.ts-960-    const userId = session?.user?.id;
src/lib/actions/lmsActions.ts-961-    if (!userId) {
src/lib/actions/lmsActions.ts-962-      return { success: false, error: 'Unauthorized' };
--
src/lib/actions/messageTemplateActions.ts-38- * Get all message templates
src/lib/actions/messageTemplateActions.ts-39- */
src/lib/actions/messageTemplateActions.ts:40:export async function getMessageTemplates(filters?: {
src/lib/actions/messageTemplateActions.ts-41-  type?: MessageType;
src/lib/actions/messageTemplateActions.ts-42-  category?: string;
src/lib/actions/messageTemplateActions.ts-43-  isActive?: boolean;
src/lib/actions/messageTemplateActions.ts-44-}) {
src/lib/actions/messageTemplateActions.ts-45-  try {
--
src/lib/actions/messageTemplateActions.ts-96- * Get a single message template by ID
src/lib/actions/messageTemplateActions.ts-97- */
src/lib/actions/messageTemplateActions.ts:98:export async function getMessageTemplate(id: string) {
src/lib/actions/messageTemplateActions.ts-99-  try {
src/lib/actions/messageTemplateActions.ts-100-    const session = await auth();
src/lib/actions/messageTemplateActions.ts-101-    if (!session?.user?.id) {
src/lib/actions/messageTemplateActions.ts-102-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageTemplateActions.ts-103-    }
--
src/lib/actions/messageTemplateActions.ts-127- * Create a new message template
src/lib/actions/messageTemplateActions.ts-128- */
src/lib/actions/messageTemplateActions.ts:129:export async function createMessageTemplate(data: MessageTemplateInput) {
src/lib/actions/messageTemplateActions.ts-130-  try {
src/lib/actions/messageTemplateActions.ts-131-    const session = await auth();
src/lib/actions/messageTemplateActions.ts-132-    if (!session?.user?.id) {
src/lib/actions/messageTemplateActions.ts-133-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageTemplateActions.ts-134-    }
--
src/lib/actions/messageTemplateActions.ts-219- * Update a message template
src/lib/actions/messageTemplateActions.ts-220- */
src/lib/actions/messageTemplateActions.ts:221:export async function updateMessageTemplate(id: string, data: Partial<MessageTemplateInput>) {
src/lib/actions/messageTemplateActions.ts-222-  try {
src/lib/actions/messageTemplateActions.ts-223-    const session = await auth();
src/lib/actions/messageTemplateActions.ts-224-    if (!session?.user?.id) {
src/lib/actions/messageTemplateActions.ts-225-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageTemplateActions.ts-226-    }
--
src/lib/actions/messageTemplateActions.ts-326- * Delete a message template
src/lib/actions/messageTemplateActions.ts-327- */
src/lib/actions/messageTemplateActions.ts:328:export async function deleteMessageTemplate(id: string) {
src/lib/actions/messageTemplateActions.ts-329-  try {
src/lib/actions/messageTemplateActions.ts-330-    const session = await auth();
src/lib/actions/messageTemplateActions.ts-331-    if (!session?.user?.id) {
src/lib/actions/messageTemplateActions.ts-332-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageTemplateActions.ts-333-    }
--
src/lib/actions/messageTemplateActions.ts-380- * Render a template with provided variables
src/lib/actions/messageTemplateActions.ts-381- */
src/lib/actions/messageTemplateActions.ts:382:export async function renderTemplate(template: string, variables: Record<string, any>): Promise<string> {
src/lib/actions/messageTemplateActions.ts-383-  let rendered = template;
src/lib/actions/messageTemplateActions.ts-384-  
src/lib/actions/messageTemplateActions.ts-385-  // Replace all variables in the format {{variableName}}
src/lib/actions/messageTemplateActions.ts-386-  Object.keys(variables).forEach(key => {
src/lib/actions/messageTemplateActions.ts-387-    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
--
src/lib/actions/messageTemplateActions.ts-395- * Get available template variables
src/lib/actions/messageTemplateActions.ts-396- */
src/lib/actions/messageTemplateActions.ts:397:export async function getAvailableTemplateVariables() {
src/lib/actions/messageTemplateActions.ts-398-  try {
src/lib/actions/messageTemplateActions.ts-399-    const session = await auth();
src/lib/actions/messageTemplateActions.ts-400-    if (!session?.user?.id) {
src/lib/actions/messageTemplateActions.ts-401-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageTemplateActions.ts-402-    }
--
src/lib/actions/messageTemplateActions.ts-474- * Duplicate a template
src/lib/actions/messageTemplateActions.ts-475- */
src/lib/actions/messageTemplateActions.ts:476:export async function duplicateMessageTemplate(id: string) {
src/lib/actions/messageTemplateActions.ts-477-  try {
src/lib/actions/messageTemplateActions.ts-478-    const session = await auth();
src/lib/actions/messageTemplateActions.ts-479-    if (!session?.user?.id) {
src/lib/actions/messageTemplateActions.ts-480-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageTemplateActions.ts-481-    }
--
src/lib/actions/reportCardTemplateActions.ts-74- * Get all report card templates
src/lib/actions/reportCardTemplateActions.ts-75- */
src/lib/actions/reportCardTemplateActions.ts:76:export async function getReportCardTemplates(): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-77-  try {
src/lib/actions/reportCardTemplateActions.ts-78-    const templates = await db.reportCardTemplate.findMany({
src/lib/actions/reportCardTemplateActions.ts-79-      orderBy: [
src/lib/actions/reportCardTemplateActions.ts-80-        { isDefault: 'desc' },
src/lib/actions/reportCardTemplateActions.ts-81-        { name: 'asc' },
--
src/lib/actions/reportCardTemplateActions.ts-96- * Get a single report card template by ID
src/lib/actions/reportCardTemplateActions.ts-97- */
src/lib/actions/reportCardTemplateActions.ts:98:export async function getReportCardTemplate(id: string): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-99-  try {
src/lib/actions/reportCardTemplateActions.ts-100-    const template = await db.reportCardTemplate.findUnique({
src/lib/actions/reportCardTemplateActions.ts-101-      where: { id },
src/lib/actions/reportCardTemplateActions.ts-102-    });
src/lib/actions/reportCardTemplateActions.ts-103-
--
src/lib/actions/reportCardTemplateActions.ts-119- * Create a new report card template
src/lib/actions/reportCardTemplateActions.ts-120- */
src/lib/actions/reportCardTemplateActions.ts:121:export async function createReportCardTemplate(input: ReportCardTemplateInput): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-122-  try {
src/lib/actions/reportCardTemplateActions.ts-123-    const session = await auth();
src/lib/actions/reportCardTemplateActions.ts-124-    const userId = session?.user?.id;
src/lib/actions/reportCardTemplateActions.ts-125-    if (!userId) {
src/lib/actions/reportCardTemplateActions.ts-126-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/reportCardTemplateActions.ts-220- * Update an existing report card template
src/lib/actions/reportCardTemplateActions.ts-221- */
src/lib/actions/reportCardTemplateActions.ts:222:export async function updateReportCardTemplate(
src/lib/actions/reportCardTemplateActions.ts-223-  id: string,
src/lib/actions/reportCardTemplateActions.ts-224-  input: Partial<ReportCardTemplateInput>
src/lib/actions/reportCardTemplateActions.ts-225-): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-226-  try {
src/lib/actions/reportCardTemplateActions.ts-227-    const session = await auth();
--
src/lib/actions/reportCardTemplateActions.ts-312- * Delete a report card template
src/lib/actions/reportCardTemplateActions.ts-313- */
src/lib/actions/reportCardTemplateActions.ts:314:export async function deleteReportCardTemplate(id: string): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-315-  try {
src/lib/actions/reportCardTemplateActions.ts-316-    const session = await auth();
src/lib/actions/reportCardTemplateActions.ts-317-    const userId = session?.user?.id;
src/lib/actions/reportCardTemplateActions.ts-318-    if (!userId) {
src/lib/actions/reportCardTemplateActions.ts-319-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/reportCardTemplateActions.ts-369- * Set a template as default
src/lib/actions/reportCardTemplateActions.ts-370- */
src/lib/actions/reportCardTemplateActions.ts:371:export async function setDefaultTemplate(id: string): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-372-  try {
src/lib/actions/reportCardTemplateActions.ts-373-    const session = await auth();
src/lib/actions/reportCardTemplateActions.ts-374-    const userId = session?.user?.id;
src/lib/actions/reportCardTemplateActions.ts-375-    if (!userId) {
src/lib/actions/reportCardTemplateActions.ts-376-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/reportCardTemplateActions.ts-413- * Toggle template active status
src/lib/actions/reportCardTemplateActions.ts-414- */
src/lib/actions/reportCardTemplateActions.ts:415:export async function toggleTemplateActive(id: string): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-416-  try {
src/lib/actions/reportCardTemplateActions.ts-417-    const session = await auth();
src/lib/actions/reportCardTemplateActions.ts-418-    const userId = session?.user?.id;
src/lib/actions/reportCardTemplateActions.ts-419-    if (!userId) {
src/lib/actions/reportCardTemplateActions.ts-420-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/reportCardTemplateActions.ts-449- * Duplicate a template
src/lib/actions/reportCardTemplateActions.ts-450- */
src/lib/actions/reportCardTemplateActions.ts:451:export async function duplicateTemplate(id: string): Promise<ActionResult> {
src/lib/actions/reportCardTemplateActions.ts-452-  try {
src/lib/actions/reportCardTemplateActions.ts-453-    const session = await auth();
src/lib/actions/reportCardTemplateActions.ts-454-    const userId = session?.user?.id;
src/lib/actions/reportCardTemplateActions.ts-455-    if (!userId) {
src/lib/actions/reportCardTemplateActions.ts-456-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/libraryActions.ts-13-
src/lib/actions/libraryActions.ts-14-// Get all books with pagination and filters
src/lib/actions/libraryActions.ts:15:export async function getBooks(params?: {
src/lib/actions/libraryActions.ts-16-  page?: number;
src/lib/actions/libraryActions.ts-17-  limit?: number;
src/lib/actions/libraryActions.ts-18-  search?: string;
src/lib/actions/libraryActions.ts-19-  category?: string;
src/lib/actions/libraryActions.ts-20-}) {
--
src/lib/actions/libraryActions.ts-74-
src/lib/actions/libraryActions.ts-75-// Get a single book by ID
src/lib/actions/libraryActions.ts:76:export async function getBookById(id: string) {
src/lib/actions/libraryActions.ts-77-  try {
src/lib/actions/libraryActions.ts-78-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-79-    if (!schoolId) throw new Error("School context required");
src/lib/actions/libraryActions.ts-80-    const book = await db.book.findUnique({
src/lib/actions/libraryActions.ts-81-      where: { id, schoolId },
--
src/lib/actions/libraryActions.ts-120-
src/lib/actions/libraryActions.ts-121-// Get all unique categories
src/lib/actions/libraryActions.ts:122:export async function getBookCategories() {
src/lib/actions/libraryActions.ts-123-    try {
src/lib/actions/libraryActions.ts-124-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-125-      if (!schoolId) throw new Error("School context required");
src/lib/actions/libraryActions.ts-126-      const books = await db.book.findMany({
src/lib/actions/libraryActions.ts-127-        where: { schoolId },
--
src/lib/actions/libraryActions.ts-139-
src/lib/actions/libraryActions.ts-140-  // Create a new book
src/lib/actions/libraryActions.ts:141:  export async function createBook(data: BookFormValues) {
src/lib/actions/libraryActions.ts-142-    try {
src/lib/actions/libraryActions.ts-143-      // Validate input
src/lib/actions/libraryActions.ts-144-      const validated = bookSchema.parse(data);
src/lib/actions/libraryActions.ts-145-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-146-      if (!schoolId) return { success: false, error: "School context required" };
--
src/lib/actions/libraryActions.ts-186-
src/lib/actions/libraryActions.ts-187-  // Update a book
src/lib/actions/libraryActions.ts:188:  export async function updateBook(data: BookUpdateFormValues) {
src/lib/actions/libraryActions.ts-189-    try {
src/lib/actions/libraryActions.ts-190-      // Validate input
src/lib/actions/libraryActions.ts-191-      const validated = bookUpdateSchema.parse(data);
src/lib/actions/libraryActions.ts-192-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-193-      if (!schoolId) return { success: false, error: "School context required" };
--
src/lib/actions/libraryActions.ts-250-
src/lib/actions/libraryActions.ts-251-  // Delete a book
src/lib/actions/libraryActions.ts:252:  export async function deleteBook(id: string) {
src/lib/actions/libraryActions.ts-253-    try {
src/lib/actions/libraryActions.ts-254-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-255-      if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/libraryActions.ts-256-      // Check if book exists
src/lib/actions/libraryActions.ts-257-      const book = await db.book.findUnique({
--
src/lib/actions/libraryActions.ts-310-
src/lib/actions/libraryActions.ts-311-  // Issue a book to a student
src/lib/actions/libraryActions.ts:312:  export async function issueBook(data: {
src/lib/actions/libraryActions.ts-313-    bookId: string;
src/lib/actions/libraryActions.ts-314-    studentId: string;
src/lib/actions/libraryActions.ts-315-    dueDate: Date;
src/lib/actions/libraryActions.ts-316-  }) {
src/lib/actions/libraryActions.ts-317-    try {
--
src/lib/actions/libraryActions.ts-426-
src/lib/actions/libraryActions.ts-427-  // Return a book
src/lib/actions/libraryActions.ts:428:  export async function returnBook(data: {
src/lib/actions/libraryActions.ts-429-    issueId: string;
src/lib/actions/libraryActions.ts-430-    returnDate?: Date;
src/lib/actions/libraryActions.ts-431-    dailyFineRate?: number;
src/lib/actions/libraryActions.ts-432-  }) {
src/lib/actions/libraryActions.ts-433-    try {
--
src/lib/actions/libraryActions.ts-544-
src/lib/actions/libraryActions.ts-545-  // Get all book issues with pagination and filters
src/lib/actions/libraryActions.ts:546:  export async function getBookIssues(params?: {
src/lib/actions/libraryActions.ts-547-    page?: number;
src/lib/actions/libraryActions.ts-548-    limit?: number;
src/lib/actions/libraryActions.ts-549-    status?: string;
src/lib/actions/libraryActions.ts-550-    studentId?: string;
src/lib/actions/libraryActions.ts-551-    bookId?: string;
--
src/lib/actions/libraryActions.ts-609-
src/lib/actions/libraryActions.ts-610-  // Get a single book issue by ID
src/lib/actions/libraryActions.ts:611:  export async function getBookIssueById(id: string) {
src/lib/actions/libraryActions.ts-612-    try {
src/lib/actions/libraryActions.ts-613-      const issue = await db.bookIssue.findUnique({
src/lib/actions/libraryActions.ts-614-        where: { id },
src/lib/actions/libraryActions.ts-615-        include: {
src/lib/actions/libraryActions.ts-616-          book: true,
--
src/lib/actions/libraryActions.ts-631-
src/lib/actions/libraryActions.ts-632-  // Update overdue book issues
src/lib/actions/libraryActions.ts:633:  export async function updateOverdueIssues() {
src/lib/actions/libraryActions.ts-634-    try {
src/lib/actions/libraryActions.ts-635-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-636-      if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/libraryActions.ts-637-      const today = new Date();
src/lib/actions/libraryActions.ts-638-      today.setHours(0, 0, 0, 0);
--
src/lib/actions/libraryActions.ts-671-
src/lib/actions/libraryActions.ts-672-  // Get library statistics
src/lib/actions/libraryActions.ts:673:  export async function getLibraryStats() {
src/lib/actions/libraryActions.ts-674-    try {
src/lib/actions/libraryActions.ts-675-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-676-      if (!schoolId) throw new Error("School context required");
src/lib/actions/libraryActions.ts-677-      const [
src/lib/actions/libraryActions.ts-678-        totalBooks,
--
src/lib/actions/libraryActions.ts-727-
src/lib/actions/libraryActions.ts-728-  // Get recent book issues and returns
src/lib/actions/libraryActions.ts:729:  export async function getRecentLibraryActivity(limit: number = 10) {
src/lib/actions/libraryActions.ts-730-    try {
src/lib/actions/libraryActions.ts-731-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-732-      if (!schoolId) throw new Error("School context required");
src/lib/actions/libraryActions.ts-733-
src/lib/actions/libraryActions.ts-734-      const recentIssues = await db.bookIssue.findMany({
--
src/lib/actions/libraryActions.ts-807-
src/lib/actions/libraryActions.ts-808-  // Create a book reservation
src/lib/actions/libraryActions.ts:809:  export async function createBookReservation(data: {
src/lib/actions/libraryActions.ts-810-    bookId: string;
src/lib/actions/libraryActions.ts-811-    studentId: string;
src/lib/actions/libraryActions.ts-812-    expiresAt?: Date;
src/lib/actions/libraryActions.ts-813-  }) {
src/lib/actions/libraryActions.ts-814-    try {
--
src/lib/actions/libraryActions.ts-931-
src/lib/actions/libraryActions.ts-932-  // Get all book reservations with pagination and filters
src/lib/actions/libraryActions.ts:933:  export async function getBookReservations(params?: {
src/lib/actions/libraryActions.ts-934-    page?: number;
src/lib/actions/libraryActions.ts-935-    limit?: number;
src/lib/actions/libraryActions.ts-936-    status?: string;
src/lib/actions/libraryActions.ts-937-    studentId?: string;
src/lib/actions/libraryActions.ts-938-    bookId?: string;
--
src/lib/actions/libraryActions.ts-997-
src/lib/actions/libraryActions.ts-998-  // Get a single book reservation by ID
src/lib/actions/libraryActions.ts:999:  export async function getBookReservationById(id: string) {
src/lib/actions/libraryActions.ts-1000-    try {
src/lib/actions/libraryActions.ts-1001-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-1002-      if (!schoolId) throw new Error("School context required");
src/lib/actions/libraryActions.ts-1003-
src/lib/actions/libraryActions.ts-1004-      const reservation = await db.bookReservation.findUnique({
--
src/lib/actions/libraryActions.ts-1022-
src/lib/actions/libraryActions.ts-1023-  // Cancel a book reservation
src/lib/actions/libraryActions.ts:1024:  export async function cancelBookReservation(id: string) {
src/lib/actions/libraryActions.ts-1025-    try {
src/lib/actions/libraryActions.ts-1026-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-1027-      if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/libraryActions.ts-1028-
src/lib/actions/libraryActions.ts-1029-      // Check if reservation exists
--
src/lib/actions/libraryActions.ts-1090-
src/lib/actions/libraryActions.ts-1091-  // Fulfill a book reservation (when book becomes available and is issued to the student)
src/lib/actions/libraryActions.ts:1092:  export async function fulfillBookReservation(data: {
src/lib/actions/libraryActions.ts-1093-    reservationId: string;
src/lib/actions/libraryActions.ts-1094-    dueDate: Date;
src/lib/actions/libraryActions.ts-1095-  }) {
src/lib/actions/libraryActions.ts-1096-    try {
src/lib/actions/libraryActions.ts-1097-      const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/libraryActions.ts-1202-
src/lib/actions/libraryActions.ts-1203-  // Update expired reservations
src/lib/actions/libraryActions.ts:1204:  export async function updateExpiredReservations() {
src/lib/actions/libraryActions.ts-1205-    try {
src/lib/actions/libraryActions.ts-1206-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-1207-      if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/libraryActions.ts-1208-
src/lib/actions/libraryActions.ts-1209-      const now = new Date();
--
src/lib/actions/libraryActions.ts-1240-
src/lib/actions/libraryActions.ts-1241-  // Notify students when reserved books become available
src/lib/actions/libraryActions.ts:1242:  export async function notifyReservedBookAvailable(bookId: string) {
src/lib/actions/libraryActions.ts-1243-    try {
src/lib/actions/libraryActions.ts-1244-      const { schoolId } = await requireSchoolAccess();
src/lib/actions/libraryActions.ts-1245-      if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/libraryActions.ts-1246-      
src/lib/actions/libraryActions.ts-1247-      // Get the book
--
src/lib/actions/list-actions.ts-8- * Get paginated list of students
src/lib/actions/list-actions.ts-9- */
src/lib/actions/list-actions.ts:10:export async function getStudentsList(params: {
src/lib/actions/list-actions.ts-11-  page?: number;
src/lib/actions/list-actions.ts-12-  limit?: number;
src/lib/actions/list-actions.ts-13-  search?: string;
src/lib/actions/list-actions.ts-14-  classId?: string;
src/lib/actions/list-actions.ts-15-  sectionId?: string;
--
src/lib/actions/list-actions.ts-104- * Get paginated list of teachers
src/lib/actions/list-actions.ts-105- */
src/lib/actions/list-actions.ts:106:export async function getTeachersList(params: {
src/lib/actions/list-actions.ts-107-  page?: number;
src/lib/actions/list-actions.ts-108-  limit?: number;
src/lib/actions/list-actions.ts-109-  search?: string;
src/lib/actions/list-actions.ts-110-  departmentId?: string;
src/lib/actions/list-actions.ts-111-  subjectId?: string;
--
src/lib/actions/list-actions.ts-201- * Get paginated list of parents
src/lib/actions/list-actions.ts-202- */
src/lib/actions/list-actions.ts:203:export async function getParentsList(params: {
src/lib/actions/list-actions.ts-204-  page?: number;
src/lib/actions/list-actions.ts-205-  limit?: number;
src/lib/actions/list-actions.ts-206-  search?: string;
src/lib/actions/list-actions.ts-207-}) {
src/lib/actions/list-actions.ts-208-  try {
--
src/lib/actions/list-actions.ts-282- * Get paginated list of attendance records
src/lib/actions/list-actions.ts-283- */
src/lib/actions/list-actions.ts:284:export async function getAttendanceList(params: {
src/lib/actions/list-actions.ts-285-  page?: number;
src/lib/actions/list-actions.ts-286-  limit?: number;
src/lib/actions/list-actions.ts-287-  classId?: string;
src/lib/actions/list-actions.ts-288-  sectionId?: string;
src/lib/actions/list-actions.ts-289-  startDate?: Date;
--
src/lib/actions/list-actions.ts-374- * Get paginated list of fee payments
src/lib/actions/list-actions.ts-375- */
src/lib/actions/list-actions.ts:376:export async function getFeePaymentsList(params: {
src/lib/actions/list-actions.ts-377-  page?: number;
src/lib/actions/list-actions.ts-378-  limit?: number;
src/lib/actions/list-actions.ts-379-  studentId?: string;
src/lib/actions/list-actions.ts-380-  status?: string;
src/lib/actions/list-actions.ts-381-  startDate?: Date;
--
src/lib/actions/list-actions.ts-451- * Get paginated list of exams
src/lib/actions/list-actions.ts-452- */
src/lib/actions/list-actions.ts:453:export async function getExamsList(params: {
src/lib/actions/list-actions.ts-454-  page?: number;
src/lib/actions/list-actions.ts-455-  limit?: number;
src/lib/actions/list-actions.ts-456-  subjectId?: string;
src/lib/actions/list-actions.ts-457-  termId?: string;
src/lib/actions/list-actions.ts-458-  upcoming?: boolean;
--
src/lib/actions/list-actions.ts-527- * Get paginated list of assignments
src/lib/actions/list-actions.ts-528- */
src/lib/actions/list-actions.ts:529:export async function getAssignmentsList(params: {
src/lib/actions/list-actions.ts-530-  page?: number;
src/lib/actions/list-actions.ts-531-  limit?: number;
src/lib/actions/list-actions.ts-532-  classId?: string;
src/lib/actions/list-actions.ts-533-  subjectId?: string;
src/lib/actions/list-actions.ts-534-  status?: string;
--
src/lib/actions/list-actions.ts-615- * Get paginated list of announcements
src/lib/actions/list-actions.ts-616- */
src/lib/actions/list-actions.ts:617:export async function getAnnouncementsList(params: {
src/lib/actions/list-actions.ts-618-  page?: number;
src/lib/actions/list-actions.ts-619-  limit?: number;
src/lib/actions/list-actions.ts-620-  targetRole?: UserRole;
src/lib/actions/list-actions.ts-621-}) {
src/lib/actions/list-actions.ts-622-  try {
--
src/lib/actions/list-actions.ts-676- * Get paginated list of events
src/lib/actions/list-actions.ts-677- */
src/lib/actions/list-actions.ts:678:export async function getEventsList(params: {
src/lib/actions/list-actions.ts-679-  page?: number;
src/lib/actions/list-actions.ts-680-  limit?: number;
src/lib/actions/list-actions.ts-681-  upcoming?: boolean;
src/lib/actions/list-actions.ts-682-  type?: string;
src/lib/actions/list-actions.ts-683-}) {
--
src/lib/actions/messageHistoryActions.ts-44- * Log a bulk message operation to history
src/lib/actions/messageHistoryActions.ts-45- */
src/lib/actions/messageHistoryActions.ts:46:export async function logMessageHistory(data: MessageHistoryInput, schoolId: string) {
src/lib/actions/messageHistoryActions.ts-47-  try {
src/lib/actions/messageHistoryActions.ts-48-    const user = await currentUser();
src/lib/actions/messageHistoryActions.ts-49-    if (!user) {
src/lib/actions/messageHistoryActions.ts-50-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageHistoryActions.ts-51-    }
--
src/lib/actions/messageHistoryActions.ts-94- * Get message history with filters and pagination
src/lib/actions/messageHistoryActions.ts-95- */
src/lib/actions/messageHistoryActions.ts:96:export async function getMessageHistory(
src/lib/actions/messageHistoryActions.ts-97-  filters?: MessageHistoryFilters,
src/lib/actions/messageHistoryActions.ts-98-  page: number = 1,
src/lib/actions/messageHistoryActions.ts-99-  pageSize: number = 50
src/lib/actions/messageHistoryActions.ts-100-) {
src/lib/actions/messageHistoryActions.ts-101-  try {
--
src/lib/actions/messageHistoryActions.ts-194- * Get a single message history entry by ID
src/lib/actions/messageHistoryActions.ts-195- */
src/lib/actions/messageHistoryActions.ts:196:export async function getMessageHistoryById(id: string) {
src/lib/actions/messageHistoryActions.ts-197-  try {
src/lib/actions/messageHistoryActions.ts-198-    const user = await currentUser();
src/lib/actions/messageHistoryActions.ts-199-    if (!user) {
src/lib/actions/messageHistoryActions.ts-200-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageHistoryActions.ts-201-    }
--
src/lib/actions/messageHistoryActions.ts-245- * Get message analytics and statistics
src/lib/actions/messageHistoryActions.ts-246- */
src/lib/actions/messageHistoryActions.ts:247:export async function getMessageAnalytics(
src/lib/actions/messageHistoryActions.ts-248-  startDate?: Date,
src/lib/actions/messageHistoryActions.ts-249-  endDate?: Date
src/lib/actions/messageHistoryActions.ts-250-) {
src/lib/actions/messageHistoryActions.ts-251-  try {
src/lib/actions/messageHistoryActions.ts-252-    const user = await currentUser();
--
src/lib/actions/messageHistoryActions.ts-429- * Delete message history entry
src/lib/actions/messageHistoryActions.ts-430- */
src/lib/actions/messageHistoryActions.ts:431:export async function deleteMessageHistory(id: string) {
src/lib/actions/messageHistoryActions.ts-432-  try {
src/lib/actions/messageHistoryActions.ts-433-    const user = await currentUser();
src/lib/actions/messageHistoryActions.ts-434-    if (!user) {
src/lib/actions/messageHistoryActions.ts-435-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageHistoryActions.ts-436-    }
--
src/lib/actions/teacherResultsActions.ts-9- * Get all results for a teacher (exams and assignments)
src/lib/actions/teacherResultsActions.ts-10- */
src/lib/actions/teacherResultsActions.ts:11:export async function getTeacherResults(classId?: string, subjectId?: string) {
src/lib/actions/teacherResultsActions.ts-12-  try {
src/lib/actions/teacherResultsActions.ts-13-    // Add school isolation
src/lib/actions/teacherResultsActions.ts-14-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherResultsActions.ts-15-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherResultsActions.ts-16-
--
src/lib/actions/teacherResultsActions.ts-258- * Get exam result details for a specific exam
src/lib/actions/teacherResultsActions.ts-259- */
src/lib/actions/teacherResultsActions.ts:260:export async function getExamResultDetails(examId: string) {
src/lib/actions/teacherResultsActions.ts-261-  try {
src/lib/actions/teacherResultsActions.ts-262-    // Add school isolation
src/lib/actions/teacherResultsActions.ts-263-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherResultsActions.ts-264-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherResultsActions.ts-265-
--
src/lib/actions/teacherResultsActions.ts-401- * Get assignment result details for a specific assignment
src/lib/actions/teacherResultsActions.ts-402- */
src/lib/actions/teacherResultsActions.ts:403:export async function getAssignmentResultDetails(assignmentId: string) {
src/lib/actions/teacherResultsActions.ts-404-  try {
src/lib/actions/teacherResultsActions.ts-405-    // Add school isolation
src/lib/actions/teacherResultsActions.ts-406-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherResultsActions.ts-407-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherResultsActions.ts-408-
--
src/lib/actions/teacherResultsActions.ts-551- * Update exam results
src/lib/actions/teacherResultsActions.ts-552- */
src/lib/actions/teacherResultsActions.ts:553:export async function updateExamResults(examId: string, results: any[]) {
src/lib/actions/teacherResultsActions.ts-554-  try {
src/lib/actions/teacherResultsActions.ts-555-    // Add school isolation
src/lib/actions/teacherResultsActions.ts-556-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherResultsActions.ts-557-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherResultsActions.ts-558-
--
src/lib/actions/teacherResultsActions.ts-629- * Get student performance data
src/lib/actions/teacherResultsActions.ts-630- */
src/lib/actions/teacherResultsActions.ts:631:export async function getStudentPerformanceData(studentId: string, subjectId?: string) {
src/lib/actions/teacherResultsActions.ts-632-  try {
src/lib/actions/teacherResultsActions.ts-633-    // Add school isolation
src/lib/actions/teacherResultsActions.ts-634-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherResultsActions.ts-635-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherResultsActions.ts-636-
--
src/lib/actions/teacherResultsActions.ts-829- * Get class performance data
src/lib/actions/teacherResultsActions.ts-830- */
src/lib/actions/teacherResultsActions.ts:831:export async function getClassPerformanceData(classId: string, subjectId?: string) {
src/lib/actions/teacherResultsActions.ts-832-  try {
src/lib/actions/teacherResultsActions.ts-833-    // Add school isolation
src/lib/actions/teacherResultsActions.ts-834-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherResultsActions.ts-835-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherResultsActions.ts-836-
--
src/lib/actions/admissionConversionActions.ts-44- * Convert an accepted admission application to an enrolled student
src/lib/actions/admissionConversionActions.ts-45- */
src/lib/actions/admissionConversionActions.ts:46:export async function convertAdmissionToStudent(
src/lib/actions/admissionConversionActions.ts-47-  applicationId: string,
src/lib/actions/admissionConversionActions.ts-48-  options?: {
src/lib/actions/admissionConversionActions.ts-49-    rollNumber?: string;
src/lib/actions/admissionConversionActions.ts-50-    sectionId?: string;
src/lib/actions/admissionConversionActions.ts-51-    sendCredentials?: boolean;
--
src/lib/actions/admissionConversionActions.ts-302- * Bulk convert multiple accepted applications to students
src/lib/actions/admissionConversionActions.ts-303- */
src/lib/actions/admissionConversionActions.ts:304:export async function bulkConvertAdmissionsToStudents(
src/lib/actions/admissionConversionActions.ts-305-  applicationIds: string[],
src/lib/actions/admissionConversionActions.ts-306-  options?: {
src/lib/actions/admissionConversionActions.ts-307-    sendCredentials?: boolean;
src/lib/actions/admissionConversionActions.ts-308-  }
src/lib/actions/admissionConversionActions.ts-309-) {
--
src/lib/actions/admissionConversionActions.ts-338- * Get student created from an admission application
src/lib/actions/admissionConversionActions.ts-339- */
src/lib/actions/admissionConversionActions.ts:340:export async function getStudentFromApplication(applicationId: string) {
src/lib/actions/admissionConversionActions.ts-341-  try {
src/lib/actions/admissionConversionActions.ts-342-    const application = await db.admissionApplication.findUnique({
src/lib/actions/admissionConversionActions.ts-343-      where: { id: applicationId },
src/lib/actions/admissionConversionActions.ts-344-      include: {
src/lib/actions/admissionConversionActions.ts-345-        student: {
--
src/lib/actions/analytics-actions.ts-13-} from "@/lib/utils/cached-auth-analytics";
src/lib/actions/analytics-actions.ts-14-
src/lib/actions/analytics-actions.ts:15:export async function getDashboardAnalytics(timeRange: string = "30d") {
src/lib/actions/analytics-actions.ts-16-  await requireSuperAdminAccess();
src/lib/actions/analytics-actions.ts-17-
src/lib/actions/analytics-actions.ts-18-  const now = new Date();
src/lib/actions/analytics-actions.ts-19-  let startDate: Date;
src/lib/actions/analytics-actions.ts-20-  let endDate = now;
--
src/lib/actions/analytics-actions.ts-294-}
src/lib/actions/analytics-actions.ts-295-
src/lib/actions/analytics-actions.ts:296:export async function getRevenueAnalytics(timeRange: string = "30d") {
src/lib/actions/analytics-actions.ts-297-  await requireSuperAdminAccess();
src/lib/actions/analytics-actions.ts-298-
src/lib/actions/analytics-actions.ts-299-  const now = new Date();
src/lib/actions/analytics-actions.ts-300-  let startDate: Date;
src/lib/actions/analytics-actions.ts-301-
--
src/lib/actions/analytics-actions.ts-379-}
src/lib/actions/analytics-actions.ts-380-
src/lib/actions/analytics-actions.ts:381:export async function getAuthenticationAnalytics(timeRange: string = "30d", schoolId?: string) {
src/lib/actions/analytics-actions.ts-382-  await requireSuperAdminAccess();
src/lib/actions/analytics-actions.ts-383-
src/lib/actions/analytics-actions.ts-384-  const now = new Date();
src/lib/actions/analytics-actions.ts-385-  let startDate: Date;
src/lib/actions/analytics-actions.ts-386-
--
src/lib/actions/parent-performance-actions.ts-113- * Requirements: 3.1
src/lib/actions/parent-performance-actions.ts-114- */
src/lib/actions/parent-performance-actions.ts:115:export async function getExamResults(input: GetExamResultsInput) {
src/lib/actions/parent-performance-actions.ts-116-  try {
src/lib/actions/parent-performance-actions.ts-117-    // Add school isolation
src/lib/actions/parent-performance-actions.ts-118-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-performance-actions.ts-119-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-performance-actions.ts-120-
--
src/lib/actions/parent-performance-actions.ts-289- * Requirements: 3.2
src/lib/actions/parent-performance-actions.ts-290- */
src/lib/actions/parent-performance-actions.ts:291:export async function getProgressReports(input: GetProgressReportsInput) {
src/lib/actions/parent-performance-actions.ts-292-  try {
src/lib/actions/parent-performance-actions.ts-293-    // Add school isolation
src/lib/actions/parent-performance-actions.ts-294-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-performance-actions.ts-295-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-performance-actions.ts-296-
--
src/lib/actions/parent-performance-actions.ts-517- * Requirements: 3.1, 3.3
src/lib/actions/parent-performance-actions.ts-518- */
src/lib/actions/parent-performance-actions.ts:519:export async function getPerformanceAnalytics(input: GetPerformanceAnalyticsInput) {
src/lib/actions/parent-performance-actions.ts-520-  try {
src/lib/actions/parent-performance-actions.ts-521-    // Add school isolation
src/lib/actions/parent-performance-actions.ts-522-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-performance-actions.ts-523-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-performance-actions.ts-524-
--
src/lib/actions/parent-performance-actions.ts-867- * Requirements: 3.4
src/lib/actions/parent-performance-actions.ts-868- */
src/lib/actions/parent-performance-actions.ts:869:export async function downloadReportCard(input: DownloadReportCardInput) {
src/lib/actions/parent-performance-actions.ts-870-  try {
src/lib/actions/parent-performance-actions.ts-871-    // Add school isolation
src/lib/actions/parent-performance-actions.ts-872-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-performance-actions.ts-873-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-performance-actions.ts-874-
--
src/lib/actions/parent-performance-actions.ts-1063- * Requirements: 3.1
src/lib/actions/parent-performance-actions.ts-1064- */
src/lib/actions/parent-performance-actions.ts:1065:export async function getClassComparison(input: GetClassComparisonInput) {
src/lib/actions/parent-performance-actions.ts-1066-  try {
src/lib/actions/parent-performance-actions.ts-1067-    // Add school isolation
src/lib/actions/parent-performance-actions.ts-1068-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-performance-actions.ts-1069-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-performance-actions.ts-1070-
--
src/lib/actions/moduleActions.ts-42- * Authorization: Admin only
src/lib/actions/moduleActions.ts-43- */
src/lib/actions/moduleActions.ts:44:export async function createModule(
src/lib/actions/moduleActions.ts-45-  input: CreateModuleInput
src/lib/actions/moduleActions.ts-46-): Promise<ActionResponse> {
src/lib/actions/moduleActions.ts-47-  try {
src/lib/actions/moduleActions.ts-48-    // Check authorization - only admins can create modules
src/lib/actions/moduleActions.ts-49-    const authResult = await requireModifyAccess();
--
src/lib/actions/moduleActions.ts-152- * Authorization: Admin only
src/lib/actions/moduleActions.ts-153- */
src/lib/actions/moduleActions.ts:154:export async function updateModule(
src/lib/actions/moduleActions.ts-155-  input: UpdateModuleInput
src/lib/actions/moduleActions.ts-156-): Promise<ActionResponse> {
src/lib/actions/moduleActions.ts-157-  try {
src/lib/actions/moduleActions.ts-158-    // Check authorization - only admins can update modules
src/lib/actions/moduleActions.ts-159-    const authResult = await requireModifyAccess();
--
src/lib/actions/moduleActions.ts-264- * Authorization: Admin only
src/lib/actions/moduleActions.ts-265- */
src/lib/actions/moduleActions.ts:266:export async function deleteModule(id: string): Promise<ActionResponse> {
src/lib/actions/moduleActions.ts-267-  try {
src/lib/actions/moduleActions.ts-268-    // Check authorization - only admins can delete modules
src/lib/actions/moduleActions.ts-269-    const authResult = await requireModifyAccess();
src/lib/actions/moduleActions.ts-270-    if (!authResult.authorized) {
src/lib/actions/moduleActions.ts-271-      return formatAuthError(authResult);
--
src/lib/actions/moduleActions.ts-325- * Authorization: All authenticated users (admin, teacher, student)
src/lib/actions/moduleActions.ts-326- */
src/lib/actions/moduleActions.ts:327:export async function getModulesBySyllabus(
src/lib/actions/moduleActions.ts-328-  syllabusId: string
src/lib/actions/moduleActions.ts-329-): Promise<ActionResponse> {
src/lib/actions/moduleActions.ts-330-  try {
src/lib/actions/moduleActions.ts-331-    // Check authorization - all authenticated users can view
src/lib/actions/moduleActions.ts-332-    const authResult = await requireViewAccess();
--
src/lib/actions/moduleActions.ts-382- * Authorization: Admin only
src/lib/actions/moduleActions.ts-383- */
src/lib/actions/moduleActions.ts:384:export async function reorderModules(
src/lib/actions/moduleActions.ts-385-  input: ReorderModulesInput
src/lib/actions/moduleActions.ts-386-): Promise<ActionResponse> {
src/lib/actions/moduleActions.ts-387-  try {
src/lib/actions/moduleActions.ts-388-    // Check authorization - only admins can reorder modules
src/lib/actions/moduleActions.ts-389-    const authResult = await requireModifyAccess();
--
src/lib/actions/consolidatedMarkSheetActions.ts-37- * Get consolidated mark sheet data for a class
src/lib/actions/consolidatedMarkSheetActions.ts-38- */
src/lib/actions/consolidatedMarkSheetActions.ts:39:export async function getConsolidatedMarkSheet(filters: ConsolidatedMarkSheetFilters) {
src/lib/actions/consolidatedMarkSheetActions.ts-40-  try {
src/lib/actions/consolidatedMarkSheetActions.ts-41-    // CRITICAL: Add school isolation
src/lib/actions/consolidatedMarkSheetActions.ts-42-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/consolidatedMarkSheetActions.ts-43-    const schoolId = await getRequiredSchoolId();
src/lib/actions/consolidatedMarkSheetActions.ts-44-
--
src/lib/actions/consolidatedMarkSheetActions.ts-227- * Get filter options for consolidated mark sheet
src/lib/actions/consolidatedMarkSheetActions.ts-228- */
src/lib/actions/consolidatedMarkSheetActions.ts:229:export async function getConsolidatedMarkSheetFilters() {
src/lib/actions/consolidatedMarkSheetActions.ts-230-  try {
src/lib/actions/consolidatedMarkSheetActions.ts-231-    // CRITICAL: Add school isolation
src/lib/actions/consolidatedMarkSheetActions.ts-232-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/consolidatedMarkSheetActions.ts-233-    const schoolId = await getRequiredSchoolId();
src/lib/actions/consolidatedMarkSheetActions.ts-234-
--
src/lib/actions/consolidatedMarkSheetActions.ts-284- * Export consolidated mark sheet to CSV format
src/lib/actions/consolidatedMarkSheetActions.ts-285- */
src/lib/actions/consolidatedMarkSheetActions.ts:286:export async function exportConsolidatedMarkSheetCSV(filters: ConsolidatedMarkSheetFilters) {
src/lib/actions/consolidatedMarkSheetActions.ts-287-  try {
src/lib/actions/consolidatedMarkSheetActions.ts-288-    const result = await getConsolidatedMarkSheet(filters);
src/lib/actions/consolidatedMarkSheetActions.ts-289-
src/lib/actions/consolidatedMarkSheetActions.ts-290-    if (!result.success || !result.data) {
src/lib/actions/consolidatedMarkSheetActions.ts-291-      return {
--
src/lib/actions/consolidatedMarkSheetActions.ts-369- * Get data formatted for Excel export
src/lib/actions/consolidatedMarkSheetActions.ts-370- */
src/lib/actions/consolidatedMarkSheetActions.ts:371:export async function getConsolidatedMarkSheetForExcel(filters: ConsolidatedMarkSheetFilters) {
src/lib/actions/consolidatedMarkSheetActions.ts-372-  try {
src/lib/actions/consolidatedMarkSheetActions.ts-373-    const result = await getConsolidatedMarkSheet(filters);
src/lib/actions/consolidatedMarkSheetActions.ts-374-
src/lib/actions/consolidatedMarkSheetActions.ts-375-    if (!result.success || !result.data) {
src/lib/actions/consolidatedMarkSheetActions.ts-376-      return {
--
src/lib/actions/driverActions.ts-7-
src/lib/actions/driverActions.ts-8-// Get all drivers with pagination and filters
src/lib/actions/driverActions.ts:9:export async function getDrivers(params?: {
src/lib/actions/driverActions.ts-10-  page?: number;
src/lib/actions/driverActions.ts-11-  limit?: number;
src/lib/actions/driverActions.ts-12-  search?: string;
src/lib/actions/driverActions.ts-13-}) {
src/lib/actions/driverActions.ts-14-  try {
--
src/lib/actions/driverActions.ts-64-
src/lib/actions/driverActions.ts-65-// Get a single driver by ID
src/lib/actions/driverActions.ts:66:export async function getDriverById(id: string) {
src/lib/actions/driverActions.ts-67-  try {
src/lib/actions/driverActions.ts-68-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/driverActions.ts-69-    if (!schoolId) throw new Error("School context required");
src/lib/actions/driverActions.ts-70-
src/lib/actions/driverActions.ts-71-    const driver = await db.driver.findUnique({
--
src/lib/actions/driverActions.ts-103-
src/lib/actions/driverActions.ts-104-// Create a new driver
src/lib/actions/driverActions.ts:105:export async function createDriver(data: DriverFormValues) {
src/lib/actions/driverActions.ts-106-  try {
src/lib/actions/driverActions.ts-107-    // Validate input
src/lib/actions/driverActions.ts-108-    const validated = driverSchema.parse(data);
src/lib/actions/driverActions.ts-109-
src/lib/actions/driverActions.ts-110-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/driverActions.ts-142-
src/lib/actions/driverActions.ts-143-// Update a driver
src/lib/actions/driverActions.ts:144:export async function updateDriver(id: string, data: DriverUpdateFormValues) {
src/lib/actions/driverActions.ts-145-  try {
src/lib/actions/driverActions.ts-146-    // Validate input
src/lib/actions/driverActions.ts-147-    const validated = driverUpdateSchema.parse(data);
src/lib/actions/driverActions.ts-148-
src/lib/actions/driverActions.ts-149-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/driverActions.ts-193-
src/lib/actions/driverActions.ts-194-// Delete a driver
src/lib/actions/driverActions.ts:195:export async function deleteDriver(id: string) {
src/lib/actions/driverActions.ts-196-  try {
src/lib/actions/driverActions.ts-197-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/driverActions.ts-198-    if (!schoolId) throw new Error("School context required");
src/lib/actions/driverActions.ts-199-
src/lib/actions/driverActions.ts-200-    // Check if driver exists
--
src/lib/actions/driverActions.ts-234-
src/lib/actions/driverActions.ts-235-// Get available drivers (not assigned to any vehicle)
src/lib/actions/driverActions.ts:236:export async function getAvailableDrivers() {
src/lib/actions/driverActions.ts-237-  try {
src/lib/actions/driverActions.ts-238-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/driverActions.ts-239-    if (!schoolId) throw new Error("School context required");
src/lib/actions/driverActions.ts-240-
src/lib/actions/driverActions.ts-241-    const drivers = await db.driver.findMany({
--
src/lib/actions/driverActions.ts-257-
src/lib/actions/driverActions.ts-258-// Get all drivers for dropdown (simple list)
src/lib/actions/driverActions.ts:259:export async function getAllDriversSimple() {
src/lib/actions/driverActions.ts-260-  try {
src/lib/actions/driverActions.ts-261-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/driverActions.ts-262-    if (!schoolId) throw new Error("School context required");
src/lib/actions/driverActions.ts-263-
src/lib/actions/driverActions.ts-264-    const drivers = await db.driver.findMany({
--
src/lib/actions/certificateTemplateActions.ts-38- * Get all certificate templates
src/lib/actions/certificateTemplateActions.ts-39- */
src/lib/actions/certificateTemplateActions.ts:40:export async function getCertificateTemplates(filters?: {
src/lib/actions/certificateTemplateActions.ts-41-  type?: CertificateType;
src/lib/actions/certificateTemplateActions.ts-42-  category?: string;
src/lib/actions/certificateTemplateActions.ts-43-  isActive?: boolean;
src/lib/actions/certificateTemplateActions.ts-44-}) {
src/lib/actions/certificateTemplateActions.ts-45-  try {
--
src/lib/actions/certificateTemplateActions.ts-88- * Get a single certificate template by ID
src/lib/actions/certificateTemplateActions.ts-89- */
src/lib/actions/certificateTemplateActions.ts:90:export async function getCertificateTemplate(id: string) {
src/lib/actions/certificateTemplateActions.ts-91-  try {
src/lib/actions/certificateTemplateActions.ts-92-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-93-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-94-
src/lib/actions/certificateTemplateActions.ts-95-    const template = await db.certificateTemplate.findUnique({
--
src/lib/actions/certificateTemplateActions.ts-119- * Create a new certificate template
src/lib/actions/certificateTemplateActions.ts-120- */
src/lib/actions/certificateTemplateActions.ts:121:export async function createCertificateTemplate(data: CertificateTemplateInput) {
src/lib/actions/certificateTemplateActions.ts-122-  try {
src/lib/actions/certificateTemplateActions.ts-123-    const { schoolId, user: dbUser } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-124-    if (!schoolId || !dbUser) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-125-
src/lib/actions/certificateTemplateActions.ts-126-    // Check permissions
--
src/lib/actions/certificateTemplateActions.ts-188- * Update a certificate template
src/lib/actions/certificateTemplateActions.ts-189- */
src/lib/actions/certificateTemplateActions.ts:190:export async function updateCertificateTemplate(id: string, data: Partial<CertificateTemplateInput>) {
src/lib/actions/certificateTemplateActions.ts-191-  try {
src/lib/actions/certificateTemplateActions.ts-192-    const { schoolId, user: dbUser } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-193-    if (!schoolId || !dbUser) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-194-
src/lib/actions/certificateTemplateActions.ts-195-    // Check permissions
--
src/lib/actions/certificateTemplateActions.ts-267- * Delete a certificate template
src/lib/actions/certificateTemplateActions.ts-268- */
src/lib/actions/certificateTemplateActions.ts:269:export async function deleteCertificateTemplate(id: string) {
src/lib/actions/certificateTemplateActions.ts-270-  try {
src/lib/actions/certificateTemplateActions.ts-271-    const { schoolId, user: dbUser } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-272-    if (!schoolId || !dbUser) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-273-
src/lib/actions/certificateTemplateActions.ts-274-    // Check permissions
--
src/lib/actions/certificateTemplateActions.ts-321- * Render a certificate template with provided variables
src/lib/actions/certificateTemplateActions.ts-322- */
src/lib/actions/certificateTemplateActions.ts:323:export async function renderCertificateTemplate(template: string, variables: Record<string, any>): Promise<string> {
src/lib/actions/certificateTemplateActions.ts-324-  let rendered = template;
src/lib/actions/certificateTemplateActions.ts-325-
src/lib/actions/certificateTemplateActions.ts-326-  // Replace all variables in the format {{variableName}}
src/lib/actions/certificateTemplateActions.ts-327-  Object.keys(variables).forEach(key => {
src/lib/actions/certificateTemplateActions.ts-328-    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
--
src/lib/actions/certificateTemplateActions.ts-336- * Get available certificate merge fields
src/lib/actions/certificateTemplateActions.ts-337- */
src/lib/actions/certificateTemplateActions.ts:338:export async function getAvailableCertificateMergeFields() {
src/lib/actions/certificateTemplateActions.ts-339-  try {
src/lib/actions/certificateTemplateActions.ts-340-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-341-    if (!schoolId) return { success: false, error: "Unauthorized" };
src/lib/actions/certificateTemplateActions.ts-342-
src/lib/actions/certificateTemplateActions.ts-343-    // Define available merge fields for different contexts
--
src/lib/actions/certificateTemplateActions.ts-406- * Duplicate a certificate template
src/lib/actions/certificateTemplateActions.ts-407- */
src/lib/actions/certificateTemplateActions.ts:408:export async function duplicateCertificateTemplate(id: string) {
src/lib/actions/certificateTemplateActions.ts-409-  try {
src/lib/actions/certificateTemplateActions.ts-410-    const { schoolId, user: dbUser } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-411-    if (!schoolId || !dbUser) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-412-
src/lib/actions/certificateTemplateActions.ts-413-    // Check permissions
--
src/lib/actions/certificateTemplateActions.ts-479- * Get certificate template statistics
src/lib/actions/certificateTemplateActions.ts-480- */
src/lib/actions/certificateTemplateActions.ts:481:export async function getCertificateTemplateStats(templateId: string) {
src/lib/actions/certificateTemplateActions.ts-482-  try {
src/lib/actions/certificateTemplateActions.ts-483-    const { schoolId, user: dbUser } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-484-    if (!schoolId || !dbUser) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-485-
src/lib/actions/certificateTemplateActions.ts-486-    // Check permissions
--
src/lib/actions/certificateTemplateActions.ts-535- * Preview a certificate template with sample data
src/lib/actions/certificateTemplateActions.ts-536- */
src/lib/actions/certificateTemplateActions.ts:537:export async function previewCertificateTemplate(templateId: string, sampleData?: Record<string, any>) {
src/lib/actions/certificateTemplateActions.ts-538-  try {
src/lib/actions/certificateTemplateActions.ts-539-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/certificateTemplateActions.ts-540-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/certificateTemplateActions.ts-541-
src/lib/actions/certificateTemplateActions.ts-542-    const template = await db.certificateTemplate.findUnique({
--
src/lib/actions/subjectPerformanceActions.ts-30-}
src/lib/actions/subjectPerformanceActions.ts-31-
src/lib/actions/subjectPerformanceActions.ts:32:export async function getSubjectPerformanceFilters() {
src/lib/actions/subjectPerformanceActions.ts-33-  try {
src/lib/actions/subjectPerformanceActions.ts-34-    // CRITICAL: Add school isolation
src/lib/actions/subjectPerformanceActions.ts-35-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/subjectPerformanceActions.ts-36-    const schoolId = await getRequiredSchoolId();
src/lib/actions/subjectPerformanceActions.ts-37-
--
src/lib/actions/subjectPerformanceActions.ts-68-}
src/lib/actions/subjectPerformanceActions.ts-69-
src/lib/actions/subjectPerformanceActions.ts:70:export async function getSubjectPerformanceReport(filters: SubjectPerformanceFilters) {
src/lib/actions/subjectPerformanceActions.ts-71-  try {
src/lib/actions/subjectPerformanceActions.ts-72-    // CRITICAL: Add school isolation
src/lib/actions/subjectPerformanceActions.ts-73-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/subjectPerformanceActions.ts-74-    const schoolId = await getRequiredSchoolId();
src/lib/actions/subjectPerformanceActions.ts-75-
--
src/lib/actions/subjectPerformanceActions.ts-221-}
src/lib/actions/subjectPerformanceActions.ts-222-
src/lib/actions/subjectPerformanceActions.ts:223:export async function exportSubjectPerformanceToPDF(filters: SubjectPerformanceFilters) {
src/lib/actions/subjectPerformanceActions.ts-224-  try {
src/lib/actions/subjectPerformanceActions.ts-225-    // CRITICAL: Add school isolation
src/lib/actions/subjectPerformanceActions.ts-226-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/subjectPerformanceActions.ts-227-    const schoolId = await getRequiredSchoolId();
src/lib/actions/subjectPerformanceActions.ts-228-
--
src/lib/actions/subjectPerformanceActions.ts-364-}
src/lib/actions/subjectPerformanceActions.ts-365-
src/lib/actions/subjectPerformanceActions.ts:366:export async function exportSubjectPerformanceToExcel(filters: SubjectPerformanceFilters) {
src/lib/actions/subjectPerformanceActions.ts-367-  try {
src/lib/actions/subjectPerformanceActions.ts-368-    // CRITICAL: Add school isolation
src/lib/actions/subjectPerformanceActions.ts-369-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/subjectPerformanceActions.ts-370-    const schoolId = await getRequiredSchoolId();
src/lib/actions/subjectPerformanceActions.ts-371-
--
src/lib/actions/student-achievement-actions.ts-82- * Get student achievements from document storage
src/lib/actions/student-achievement-actions.ts-83- */
src/lib/actions/student-achievement-actions.ts:84:export async function getStudentAchievements() {
src/lib/actions/student-achievement-actions.ts-85-  const result = await getCurrentStudent();
src/lib/actions/student-achievement-actions.ts-86-
src/lib/actions/student-achievement-actions.ts-87-  if (!result) {
src/lib/actions/student-achievement-actions.ts-88-    redirect("/login");
src/lib/actions/student-achievement-actions.ts-89-  }
--
src/lib/actions/student-achievement-actions.ts-204- * Add a certificate
src/lib/actions/student-achievement-actions.ts-205- */
src/lib/actions/student-achievement-actions.ts:206:export async function addCertificate(values: CertificateValues) {
src/lib/actions/student-achievement-actions.ts-207-  const result = await getCurrentStudent();
src/lib/actions/student-achievement-actions.ts-208-
src/lib/actions/student-achievement-actions.ts-209-  if (!result) {
src/lib/actions/student-achievement-actions.ts-210-    return { success: false, message: "Authentication required" };
src/lib/actions/student-achievement-actions.ts-211-  }
--
src/lib/actions/student-achievement-actions.ts-290- * Add an award
src/lib/actions/student-achievement-actions.ts-291- */
src/lib/actions/student-achievement-actions.ts:292:export async function addAward(values: AwardValues) {
src/lib/actions/student-achievement-actions.ts-293-  const result = await getCurrentStudent();
src/lib/actions/student-achievement-actions.ts-294-
src/lib/actions/student-achievement-actions.ts-295-  if (!result) {
src/lib/actions/student-achievement-actions.ts-296-    return { success: false, message: "Authentication required" };
src/lib/actions/student-achievement-actions.ts-297-  }
--
src/lib/actions/student-achievement-actions.ts-376- * Add extra-curricular activity
src/lib/actions/student-achievement-actions.ts-377- */
src/lib/actions/student-achievement-actions.ts:378:export async function addExtraCurricular(values: ExtraCurricularValues) {
src/lib/actions/student-achievement-actions.ts-379-  const result = await getCurrentStudent();
src/lib/actions/student-achievement-actions.ts-380-
src/lib/actions/student-achievement-actions.ts-381-  if (!result) {
src/lib/actions/student-achievement-actions.ts-382-    return { success: false, message: "Authentication required" };
src/lib/actions/student-achievement-actions.ts-383-  }
--
src/lib/actions/student-achievement-actions.ts-442- * Delete an achievement
src/lib/actions/student-achievement-actions.ts-443- */
src/lib/actions/student-achievement-actions.ts:444:export async function deleteAchievement(id: string, type: 'certificate' | 'award' | 'extraCurricular') {
src/lib/actions/student-achievement-actions.ts-445-  const result = await getCurrentStudent();
src/lib/actions/student-achievement-actions.ts-446-
src/lib/actions/student-achievement-actions.ts-447-  if (!result) {
src/lib/actions/student-achievement-actions.ts-448-    return { success: false, message: "Authentication required" };
src/lib/actions/student-achievement-actions.ts-449-  }
--
src/lib/actions/student-actions.ts-6-import { requireSchoolAccess } from "@/lib/auth/tenant";
src/lib/actions/student-actions.ts-7-
src/lib/actions/student-actions.ts:8:export async function getStudentProfile() {
src/lib/actions/student-actions.ts-9-  const session = await auth();
src/lib/actions/student-actions.ts-10-  if (!session?.user?.id) {
src/lib/actions/student-actions.ts-11-    throw new Error("Not authenticated");
src/lib/actions/student-actions.ts-12-  }
src/lib/actions/student-actions.ts-13-
--
src/lib/actions/student-actions.ts-51-}
src/lib/actions/student-actions.ts-52-
src/lib/actions/student-actions.ts:53:export async function getStudentDashboardData() {
src/lib/actions/student-actions.ts-54-  const student = await getStudentProfile();
src/lib/actions/student-actions.ts-55-  const currentDate = new Date();
src/lib/actions/student-actions.ts-56-
src/lib/actions/student-actions.ts-57-  // Get attendance data for the current month
src/lib/actions/student-actions.ts-58-  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
--
src/lib/actions/student-actions.ts-164-}
src/lib/actions/student-actions.ts-165-
src/lib/actions/student-actions.ts:166:export async function getStudentSubjectPerformance(studentId: string) {
src/lib/actions/student-actions.ts-167-  const { schoolId } = await requireSchoolAccess();
src/lib/actions/student-actions.ts-168-  if (!schoolId) return [];
src/lib/actions/student-actions.ts-169-
src/lib/actions/student-actions.ts-170-  const session = await auth();
src/lib/actions/student-actions.ts-171-  if (!session?.user?.id) return [];
--
src/lib/actions/student-actions.ts-256-}
src/lib/actions/student-actions.ts-257-
src/lib/actions/student-actions.ts:258:export async function getStudentTodaySchedule(studentId: string) {
src/lib/actions/student-actions.ts-259-  const { schoolId } = await requireSchoolAccess();
src/lib/actions/student-actions.ts-260-  if (!schoolId) return [];
src/lib/actions/student-actions.ts-261-
src/lib/actions/student-actions.ts-262-  // Get the current day of the week
src/lib/actions/student-actions.ts-263-  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
--
src/lib/actions/student-actions.ts-339-}
src/lib/actions/student-actions.ts-340-
src/lib/actions/student-actions.ts:341:export async function updateStudentProfile(studentId: string, data: {
src/lib/actions/student-actions.ts-342-  firstName?: string;
src/lib/actions/student-actions.ts-343-  lastName?: string;
src/lib/actions/student-actions.ts-344-  email?: string;
src/lib/actions/student-actions.ts-345-  phone?: string;
src/lib/actions/student-actions.ts-346-  dateOfBirth?: Date;
--
src/lib/actions/messageActions.ts-7-
src/lib/actions/messageActions.ts-8-// Get messages for a user (inbox, sent, archive)
src/lib/actions/messageActions.ts:9:export async function getMessages(folder: "inbox" | "sent" | "archive" = "inbox") {
src/lib/actions/messageActions.ts-10-  try {
src/lib/actions/messageActions.ts-11-    const user = await currentUser();
src/lib/actions/messageActions.ts-12-    if (!user) {
src/lib/actions/messageActions.ts-13-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-14-    }
--
src/lib/actions/messageActions.ts-96-
src/lib/actions/messageActions.ts-97-// Get single message by ID
src/lib/actions/messageActions.ts:98:export async function getMessageById(id: string) {
src/lib/actions/messageActions.ts-99-  try {
src/lib/actions/messageActions.ts-100-    const user = await currentUser();
src/lib/actions/messageActions.ts-101-    if (!user) {
src/lib/actions/messageActions.ts-102-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-103-    }
--
src/lib/actions/messageActions.ts-153-
src/lib/actions/messageActions.ts-154-// Send new message
src/lib/actions/messageActions.ts:155:export async function sendMessage(data: any) {
src/lib/actions/messageActions.ts-156-  try {
src/lib/actions/messageActions.ts-157-    const user = await currentUser();
src/lib/actions/messageActions.ts-158-    if (!user) {
src/lib/actions/messageActions.ts-159-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-160-    }
--
src/lib/actions/messageActions.ts-224-
src/lib/actions/messageActions.ts-225-// Reply to message
src/lib/actions/messageActions.ts:226:export async function replyToMessage(messageId: string, content: string) {
src/lib/actions/messageActions.ts-227-  try {
src/lib/actions/messageActions.ts-228-    const user = await currentUser();
src/lib/actions/messageActions.ts-229-    if (!user) {
src/lib/actions/messageActions.ts-230-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-231-    }
--
src/lib/actions/messageActions.ts-306-
src/lib/actions/messageActions.ts-307-// Forward message
src/lib/actions/messageActions.ts:308:export async function forwardMessage(messageId: string, recipientId: string) {
src/lib/actions/messageActions.ts-309-  try {
src/lib/actions/messageActions.ts-310-    const user = await currentUser();
src/lib/actions/messageActions.ts-311-    if (!user) {
src/lib/actions/messageActions.ts-312-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-313-    }
--
src/lib/actions/messageActions.ts-388-
src/lib/actions/messageActions.ts-389-// Delete message
src/lib/actions/messageActions.ts:390:export async function deleteMessage(id: string) {
src/lib/actions/messageActions.ts-391-  try {
src/lib/actions/messageActions.ts-392-    const user = await currentUser();
src/lib/actions/messageActions.ts-393-    if (!user) {
src/lib/actions/messageActions.ts-394-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-395-    }
--
src/lib/actions/messageActions.ts-429-
src/lib/actions/messageActions.ts-430-// Mark message as read
src/lib/actions/messageActions.ts:431:export async function markAsRead(id: string) {
src/lib/actions/messageActions.ts-432-  try {
src/lib/actions/messageActions.ts-433-    const user = await currentUser();
src/lib/actions/messageActions.ts-434-    if (!user) {
src/lib/actions/messageActions.ts-435-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-436-    }
--
src/lib/actions/messageActions.ts-474-
src/lib/actions/messageActions.ts-475-// Get all users for recipient selection (contacts)
src/lib/actions/messageActions.ts:476:export async function getContacts() {
src/lib/actions/messageActions.ts-477-  try {
src/lib/actions/messageActions.ts-478-    const user = await currentUser();
src/lib/actions/messageActions.ts-479-    if (!user) {
src/lib/actions/messageActions.ts-480-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-481-    }
--
src/lib/actions/messageActions.ts-518-
src/lib/actions/messageActions.ts-519-// Get message statistics
src/lib/actions/messageActions.ts:520:export async function getMessageStats() {
src/lib/actions/messageActions.ts-521-  try {
src/lib/actions/messageActions.ts-522-    const user = await currentUser();
src/lib/actions/messageActions.ts-523-    if (!user) {
src/lib/actions/messageActions.ts-524-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-525-    }
--
src/lib/actions/messageActions.ts-563-
src/lib/actions/messageActions.ts-564-// Get weekly communication stats (messages and announcements)
src/lib/actions/messageActions.ts:565:export async function getWeeklyCommunicationStats() {
src/lib/actions/messageActions.ts-566-  try {
src/lib/actions/messageActions.ts-567-    const user = await currentUser();
src/lib/actions/messageActions.ts-568-    if (!user) {
src/lib/actions/messageActions.ts-569-      return { success: false, error: "Unauthorized" };
src/lib/actions/messageActions.ts-570-    }
--
src/lib/actions/usageActions.ts-8- * Wraps the service function which now enforces access control.
src/lib/actions/usageActions.ts-9- */
src/lib/actions/usageActions.ts:10:export async function getUsageStats(schoolId?: string) {
src/lib/actions/usageActions.ts-11-    try {
src/lib/actions/usageActions.ts-12-        // Service layer now validates schoolId vs current context
src/lib/actions/usageActions.ts-13-        const stats = await getServiceUsageStats(schoolId);
src/lib/actions/usageActions.ts-14-        return { success: true, data: stats };
src/lib/actions/usageActions.ts-15-    } catch (error) {
--
src/lib/actions/gradesActions.ts-7-
src/lib/actions/gradesActions.ts-8-// Get all grades
src/lib/actions/gradesActions.ts:9:export async function getGrades() {
src/lib/actions/gradesActions.ts-10-  try {
src/lib/actions/gradesActions.ts-11-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/gradesActions.ts-12-    if (!schoolId) return { success: false, error: "School context required", data: [] };
src/lib/actions/gradesActions.ts-13-
src/lib/actions/gradesActions.ts-14-    const grades = await db.gradeScale.findMany({
--
src/lib/actions/gradesActions.ts-30-
src/lib/actions/gradesActions.ts-31-// Get a single grade by ID
src/lib/actions/gradesActions.ts:32:export async function getGradeById(id: string) {
src/lib/actions/gradesActions.ts-33-  try {
src/lib/actions/gradesActions.ts-34-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/gradesActions.ts-35-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/gradesActions.ts-36-
src/lib/actions/gradesActions.ts-37-    const grade = await db.gradeScale.findUnique({
--
src/lib/actions/gradesActions.ts-54-
src/lib/actions/gradesActions.ts-55-// Create a new grade
src/lib/actions/gradesActions.ts:56:export async function createGrade(data: GradeFormValues) {
src/lib/actions/gradesActions.ts-57-  try {
src/lib/actions/gradesActions.ts-58-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/gradesActions.ts-59-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/gradesActions.ts-60-
src/lib/actions/gradesActions.ts-61-    // Check if grade overlaps with existing grades
--
src/lib/actions/gradesActions.ts-100-
src/lib/actions/gradesActions.ts-101-// Update an existing grade
src/lib/actions/gradesActions.ts:102:export async function updateGrade(data: GradeUpdateFormValues) {
src/lib/actions/gradesActions.ts-103-  try {
src/lib/actions/gradesActions.ts-104-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/gradesActions.ts-105-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/gradesActions.ts-106-
src/lib/actions/gradesActions.ts-107-    // Check if grade overlaps with existing grades
--
src/lib/actions/gradesActions.ts-147-
src/lib/actions/gradesActions.ts-148-// Delete a grade
src/lib/actions/gradesActions.ts:149:export async function deleteGrade(id: string) {
src/lib/actions/gradesActions.ts-150-  try {
src/lib/actions/gradesActions.ts-151-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/gradesActions.ts-152-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/gradesActions.ts-153-
src/lib/actions/gradesActions.ts-154-    // In a full application, we'd check if this grade is being used in exam results
--
src/lib/actions/gradesActions.ts-218-
src/lib/actions/gradesActions.ts-219-// Auto-generate standard grades
src/lib/actions/gradesActions.ts:220:export async function autoGenerateGrades() {
src/lib/actions/gradesActions.ts-221-  try {
src/lib/actions/gradesActions.ts-222-    // Get existing grades
src/lib/actions/gradesActions.ts-223-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/gradesActions.ts-224-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/gradesActions.ts-225-
--
src/lib/actions/classesActions.ts-137-
src/lib/actions/classesActions.ts-138-// Get a single class by ID with detailed information
src/lib/actions/classesActions.ts:139:export async function getClassById(id: string) {
src/lib/actions/classesActions.ts-140-  try {
src/lib/actions/classesActions.ts-141-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-142-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-143-    const classDetails = await db.class.findUnique({
src/lib/actions/classesActions.ts-144-      where: {
--
src/lib/actions/classesActions.ts-445-
src/lib/actions/classesActions.ts-446-// Delete a class
src/lib/actions/classesActions.ts:447:export async function deleteClass(id: string) {
src/lib/actions/classesActions.ts-448-  try {
src/lib/actions/classesActions.ts-449-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-450-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-451-    // Permission check: require CLASS:DELETE
src/lib/actions/classesActions.ts-452-    await checkPermission('CLASS', 'DELETE', 'You do not have permission to delete classes');
--
src/lib/actions/classesActions.ts-529-
src/lib/actions/classesActions.ts-530-// Create a new class section
src/lib/actions/classesActions.ts:531:export async function createClassSection(data: ClassSectionFormValues) {
src/lib/actions/classesActions.ts-532-  try {
src/lib/actions/classesActions.ts-533-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-534-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-535-    // Ensure class exists
src/lib/actions/classesActions.ts-536-    const existingClass = await db.class.findUnique({
--
src/lib/actions/classesActions.ts-582-
src/lib/actions/classesActions.ts-583-// Update an existing class section
src/lib/actions/classesActions.ts:584:export async function updateClassSection(data: ClassSectionUpdateFormValues) {
src/lib/actions/classesActions.ts-585-  try {
src/lib/actions/classesActions.ts-586-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-587-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-588-    // Ensure section exists
src/lib/actions/classesActions.ts-589-    const existingSection = await db.classSection.findUnique({
--
src/lib/actions/classesActions.ts-640-
src/lib/actions/classesActions.ts-641-// Delete a class section
src/lib/actions/classesActions.ts:642:export async function deleteClassSection(id: string) {
src/lib/actions/classesActions.ts-643-  try {
src/lib/actions/classesActions.ts-644-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-645-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-646-    // Get section details to revalidate paths
src/lib/actions/classesActions.ts-647-    const section = await db.classSection.findUnique({
--
src/lib/actions/classesActions.ts-699-
src/lib/actions/classesActions.ts-700-// Assign teacher to class (optionally to a specific section)
src/lib/actions/classesActions.ts:701:export async function assignTeacherToClass(data: ClassTeacherFormValues) {
src/lib/actions/classesActions.ts-702-  try {
src/lib/actions/classesActions.ts-703-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-704-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-705-    // Check if this teacher is already assigned to this class/section combination
src/lib/actions/classesActions.ts-706-    const existingAssignment = await db.classTeacher.findFirst({
--
src/lib/actions/classesActions.ts-770-
src/lib/actions/classesActions.ts-771-// Update teacher assignment
src/lib/actions/classesActions.ts:772:export async function updateTeacherAssignment(data: ClassTeacherUpdateFormValues) {
src/lib/actions/classesActions.ts-773-  try {
src/lib/actions/classesActions.ts-774-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-775-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-776-    // Check if assignment exists
src/lib/actions/classesActions.ts-777-    const existingAssignment = await db.classTeacher.findUnique({
--
src/lib/actions/classesActions.ts-842-
src/lib/actions/classesActions.ts-843-// Remove teacher from class
src/lib/actions/classesActions.ts:844:export async function removeTeacherFromClass(id: string) {
src/lib/actions/classesActions.ts-845-  try {
src/lib/actions/classesActions.ts-846-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-847-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-848-    // Get assignment details to revalidate paths
src/lib/actions/classesActions.ts-849-    const assignment = await db.classTeacher.findUnique({
--
src/lib/actions/classesActions.ts-879-
src/lib/actions/classesActions.ts-880-// Get all academic years for dropdown
src/lib/actions/classesActions.ts:881:export async function getAcademicYearsForDropdown() {
src/lib/actions/classesActions.ts-882-  try {
src/lib/actions/classesActions.ts-883-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-884-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-885-
src/lib/actions/classesActions.ts-886-    const academicYears = await db.academicYear.findMany({
--
src/lib/actions/classesActions.ts-914-
src/lib/actions/classesActions.ts-915-// Get all teachers for dropdown
src/lib/actions/classesActions.ts:916:export async function getTeachersForDropdown() {
src/lib/actions/classesActions.ts-917-  try {
src/lib/actions/classesActions.ts-918-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-919-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-920-
src/lib/actions/classesActions.ts-921-    const teachers = await db.teacher.findMany({
--
src/lib/actions/classesActions.ts-958-
src/lib/actions/classesActions.ts-959-// Get available students for a class
src/lib/actions/classesActions.ts:960:export async function getAvailableStudentsForClass(classId: string) {
src/lib/actions/classesActions.ts-961-  try {
src/lib/actions/classesActions.ts-962-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-963-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-964-    // First, get the class to check academic year
src/lib/actions/classesActions.ts-965-    const classData = await db.class.findUnique({
--
src/lib/actions/classesActions.ts-1114-
src/lib/actions/classesActions.ts-1115-// Enroll a student in a class
src/lib/actions/classesActions.ts:1116:export async function enrollStudentInClass(data: StudentEnrollmentFormValues) {
src/lib/actions/classesActions.ts-1117-  try {
src/lib/actions/classesActions.ts-1118-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-1119-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-1120-    // Validate inputs
src/lib/actions/classesActions.ts-1121-    const student = await db.student.findUnique({
--
src/lib/actions/classesActions.ts-1207-
src/lib/actions/classesActions.ts-1208-// Update student enrollment
src/lib/actions/classesActions.ts:1209:export async function updateStudentEnrollment(data: StudentEnrollmentUpdateFormValues) {
src/lib/actions/classesActions.ts-1210-  try {
src/lib/actions/classesActions.ts-1211-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-1212-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-1213-    // Validate enrollment exists
src/lib/actions/classesActions.ts-1214-    const existingEnrollment = await db.classEnrollment.findUnique({
--
src/lib/actions/classesActions.ts-1267-
src/lib/actions/classesActions.ts-1268-// Remove student from class
src/lib/actions/classesActions.ts:1269:export async function removeStudentFromClass(enrollmentId: string) {
src/lib/actions/classesActions.ts-1270-  try {
src/lib/actions/classesActions.ts-1271-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-1272-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/classesActions.ts-1273-    // Get the enrollment to revalidate path later
src/lib/actions/classesActions.ts-1274-    const enrollment = await db.classEnrollment.findUnique({
--
src/lib/actions/classesActions.ts-1313-
src/lib/actions/classesActions.ts-1314-// Get exams for a specific class
src/lib/actions/classesActions.ts:1315:export async function getExamsForClass(classId: string, academicYearId?: string) {
src/lib/actions/classesActions.ts-1316-  try {
src/lib/actions/classesActions.ts-1317-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/classesActions.ts-1318-    if (!schoolId) return []; // Returning empty array as safety for this helper
src/lib/actions/classesActions.ts-1319-    // If academicYearId is not provided, fetch it from the class
src/lib/actions/classesActions.ts-1320-    if (!academicYearId) {
--
src/lib/actions/teacherExamsActions.ts-16- * Get all exams for a teacher
src/lib/actions/teacherExamsActions.ts-17- */
src/lib/actions/teacherExamsActions.ts:18:export async function getTeacherExams(subjectId?: string) {
src/lib/actions/teacherExamsActions.ts-19-  try {
src/lib/actions/teacherExamsActions.ts-20-    const session = await auth();
src/lib/actions/teacherExamsActions.ts-21-    const userId = session?.user?.id;
src/lib/actions/teacherExamsActions.ts-22-
src/lib/actions/teacherExamsActions.ts-23-    if (!userId) {
--
src/lib/actions/teacherExamsActions.ts-144- * Get a single exam's details
src/lib/actions/teacherExamsActions.ts-145- */
src/lib/actions/teacherExamsActions.ts:146:export async function getTeacherExam(examId: string) {
src/lib/actions/teacherExamsActions.ts-147-  try {
src/lib/actions/teacherExamsActions.ts-148-    const session = await auth();
src/lib/actions/teacherExamsActions.ts-149-    const userId = session?.user?.id;
src/lib/actions/teacherExamsActions.ts-150-
src/lib/actions/teacherExamsActions.ts-151-    if (!userId) {
--
src/lib/actions/teacherExamsActions.ts-282- * Create a new exam
src/lib/actions/teacherExamsActions.ts-283- */
src/lib/actions/teacherExamsActions.ts:284:export async function createExam(formData: FormData) {
src/lib/actions/teacherExamsActions.ts-285-  try {
src/lib/actions/teacherExamsActions.ts-286-    const session = await auth();
src/lib/actions/teacherExamsActions.ts-287-    const userId = session?.user?.id;
src/lib/actions/teacherExamsActions.ts-288-
src/lib/actions/teacherExamsActions.ts-289-    if (!userId) {
--
src/lib/actions/teacherExamsActions.ts-375- * Update exam results
src/lib/actions/teacherExamsActions.ts-376- */
src/lib/actions/teacherExamsActions.ts:377:export async function updateExamResults(examId: string, results: any[]) {
src/lib/actions/teacherExamsActions.ts-378-  try {
src/lib/actions/teacherExamsActions.ts-379-    const session = await auth();
src/lib/actions/teacherExamsActions.ts-380-    const userId = session?.user?.id;
src/lib/actions/teacherExamsActions.ts-381-
src/lib/actions/teacherExamsActions.ts-382-    if (!userId) {
--
src/lib/actions/teacherExamsActions.ts-462- * Get all exam types
src/lib/actions/teacherExamsActions.ts-463- */
src/lib/actions/teacherExamsActions.ts:464:export async function getExamTypes() {
src/lib/actions/teacherExamsActions.ts-465-  try {
src/lib/actions/teacherExamsActions.ts-466-    const examTypes = await db.examType.findMany({
src/lib/actions/teacherExamsActions.ts-467-      orderBy: {
src/lib/actions/teacherExamsActions.ts-468-        name: 'asc',
src/lib/actions/teacherExamsActions.ts-469-      },
--
src/lib/actions/teacherExamsActions.ts-480- * Get active terms
src/lib/actions/teacherExamsActions.ts-481- */
src/lib/actions/teacherExamsActions.ts:482:export async function getActiveTerms() {
src/lib/actions/teacherExamsActions.ts-483-  try {
src/lib/actions/teacherExamsActions.ts-484-    // Get current academic year
src/lib/actions/teacherExamsActions.ts-485-    const currentAcademicYear = await db.academicYear.findFirst({
src/lib/actions/teacherExamsActions.ts-486-      where: {
src/lib/actions/teacherExamsActions.ts-487-        isCurrent: true,
--
src/lib/actions/teacherExamsActions.ts-513- * Get students for an exam
src/lib/actions/teacherExamsActions.ts-514- */
src/lib/actions/teacherExamsActions.ts:515:export async function getStudentsForExam(subjectId: string) {
src/lib/actions/teacherExamsActions.ts-516-  try {
src/lib/actions/teacherExamsActions.ts-517-    // Find classes for this subject
src/lib/actions/teacherExamsActions.ts-518-    const subjectClasses = await db.subjectClass.findMany({
src/lib/actions/teacherExamsActions.ts-519-      where: {
src/lib/actions/teacherExamsActions.ts-520-        subjectId,
--
src/lib/actions/teacherAssignmentsActions.ts-15- * Get all assignments for a teacher
src/lib/actions/teacherAssignmentsActions.ts-16- */
src/lib/actions/teacherAssignmentsActions.ts:17:export async function getTeacherAssignments(subjectId?: string, classId?: string) {
src/lib/actions/teacherAssignmentsActions.ts-18-  try {
src/lib/actions/teacherAssignmentsActions.ts-19-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-20-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-21-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-22-    const userId = session?.user?.id;
--
src/lib/actions/teacherAssignmentsActions.ts-137- * Get assignment details by ID
src/lib/actions/teacherAssignmentsActions.ts-138- */
src/lib/actions/teacherAssignmentsActions.ts:139:export async function getAssignmentDetails(assignmentId: string) {
src/lib/actions/teacherAssignmentsActions.ts-140-  try {
src/lib/actions/teacherAssignmentsActions.ts-141-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-142-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-143-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-144-    const userId = session?.user?.id;
--
src/lib/actions/teacherAssignmentsActions.ts-248- * Create a new assignment
src/lib/actions/teacherAssignmentsActions.ts-249- */
src/lib/actions/teacherAssignmentsActions.ts:250:export async function createAssignment(formData: FormData) {
src/lib/actions/teacherAssignmentsActions.ts-251-  try {
src/lib/actions/teacherAssignmentsActions.ts-252-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-253-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-254-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-255-    const userId = session?.user?.id;
--
src/lib/actions/teacherAssignmentsActions.ts-361- * Update an existing assignment
src/lib/actions/teacherAssignmentsActions.ts-362- */
src/lib/actions/teacherAssignmentsActions.ts:363:export async function updateAssignment(formData: FormData) {
src/lib/actions/teacherAssignmentsActions.ts-364-  try {
src/lib/actions/teacherAssignmentsActions.ts-365-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-366-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-367-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-368-    const userId = session?.user?.id;
--
src/lib/actions/teacherAssignmentsActions.ts-506- * Update assignment grades
src/lib/actions/teacherAssignmentsActions.ts-507- */
src/lib/actions/teacherAssignmentsActions.ts:508:export async function updateAssignmentGrades(assignmentId: string, grades: any[]) {
src/lib/actions/teacherAssignmentsActions.ts-509-  try {
src/lib/actions/teacherAssignmentsActions.ts-510-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-511-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-512-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-513-    const userId = session?.user?.id;
--
src/lib/actions/teacherAssignmentsActions.ts-582- * Get classes for a teacher
src/lib/actions/teacherAssignmentsActions.ts-583- */
src/lib/actions/teacherAssignmentsActions.ts:584:export async function getTeacherClasses() {
src/lib/actions/teacherAssignmentsActions.ts-585-  try {
src/lib/actions/teacherAssignmentsActions.ts-586-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-587-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-588-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-589-    const userId = session?.user?.id;
--
src/lib/actions/teacherAssignmentsActions.ts-633- * Delete an assignment
src/lib/actions/teacherAssignmentsActions.ts-634- */
src/lib/actions/teacherAssignmentsActions.ts:635:export async function deleteAssignment(assignmentId: string) {
src/lib/actions/teacherAssignmentsActions.ts-636-  try {
src/lib/actions/teacherAssignmentsActions.ts-637-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAssignmentsActions.ts-638-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAssignmentsActions.ts-639-    const session = await auth();
src/lib/actions/teacherAssignmentsActions.ts-640-    const userId = session?.user?.id;
--
src/lib/actions/parent-academic-actions.ts-9- * Get all academic information for a child
src/lib/actions/parent-academic-actions.ts-10- */
src/lib/actions/parent-academic-actions.ts:11:export async function getChildAcademicProcess(childId: string) {
src/lib/actions/parent-academic-actions.ts-12-  // Add school isolation
src/lib/actions/parent-academic-actions.ts-13-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-academic-actions.ts-14-  const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-academic-actions.ts-15-
src/lib/actions/parent-academic-actions.ts-16-  // Verify the current user is a parent
--
src/lib/actions/parent-academic-actions.ts-258- * Get class schedule for a child (weekly timetable)
src/lib/actions/parent-academic-actions.ts-259- */
src/lib/actions/parent-academic-actions.ts:260:export async function getClassSchedule(childId: string) {
src/lib/actions/parent-academic-actions.ts-261-  // Add school isolation
src/lib/actions/parent-academic-actions.ts-262-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-academic-actions.ts-263-  const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-academic-actions.ts-264-
src/lib/actions/parent-academic-actions.ts-265-  // Verify the current user is a parent
--
src/lib/actions/parent-academic-actions.ts-370- * Get homework/assignments for a child with status filtering
src/lib/actions/parent-academic-actions.ts-371- */
src/lib/actions/parent-academic-actions.ts:372:export async function getHomework(
src/lib/actions/parent-academic-actions.ts-373-  childId: string,
src/lib/actions/parent-academic-actions.ts-374-  filters?: {
src/lib/actions/parent-academic-actions.ts-375-    status?: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED' | 'ALL';
src/lib/actions/parent-academic-actions.ts-376-    subjectId?: string;
src/lib/actions/parent-academic-actions.ts-377-    fromDate?: Date;
--
src/lib/actions/parent-academic-actions.ts-515- * Get full timetable for a child for a specific week
src/lib/actions/parent-academic-actions.ts-516- */
src/lib/actions/parent-academic-actions.ts:517:export async function getFullTimetable(childId: string, week?: Date) {
src/lib/actions/parent-academic-actions.ts-518-  // Add school isolation
src/lib/actions/parent-academic-actions.ts-519-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-academic-actions.ts-520-  const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-academic-actions.ts-521-
src/lib/actions/parent-academic-actions.ts-522-  // Verify the current user is a parent
--
src/lib/actions/parent-academic-actions.ts-643- * Get subject progress for a child
src/lib/actions/parent-academic-actions.ts-644- */
src/lib/actions/parent-academic-actions.ts:645:export async function getChildSubjectProgress(childId: string, subjectId: string) {
src/lib/actions/parent-academic-actions.ts-646-  // Add school isolation
src/lib/actions/parent-academic-actions.ts-647-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-academic-actions.ts-648-  const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-academic-actions.ts-649-
src/lib/actions/parent-academic-actions.ts-650-  // Verify the current user is a parent
--
src/lib/actions/lesson-content-actions.ts-32- * Get lesson content with student progress
src/lib/actions/lesson-content-actions.ts-33- */
src/lib/actions/lesson-content-actions.ts:34:export async function getLessonContent(contentId: string) {
src/lib/actions/lesson-content-actions.ts-35-  try {
src/lib/actions/lesson-content-actions.ts-36-    const session = await auth();
src/lib/actions/lesson-content-actions.ts-37-    if (!session?.user?.id) {
src/lib/actions/lesson-content-actions.ts-38-      throw new Error("Not authenticated");
src/lib/actions/lesson-content-actions.ts-39-    }
--
src/lib/actions/lesson-content-actions.ts-82- * Get all lesson contents for a lesson or course
src/lib/actions/lesson-content-actions.ts-83- */
src/lib/actions/lesson-content-actions.ts:84:export async function getLessonContents(lessonId?: string, courseId?: string) {
src/lib/actions/lesson-content-actions.ts-85-  try {
src/lib/actions/lesson-content-actions.ts-86-    const session = await auth();
src/lib/actions/lesson-content-actions.ts-87-    if (!session?.user?.id) {
src/lib/actions/lesson-content-actions.ts-88-      throw new Error("Not authenticated");
src/lib/actions/lesson-content-actions.ts-89-    }
--
src/lib/actions/lesson-content-actions.ts-132- * Start or update content progress
src/lib/actions/lesson-content-actions.ts-133- */
src/lib/actions/lesson-content-actions.ts:134:export async function updateContentProgress(
src/lib/actions/lesson-content-actions.ts-135-  contentId: string,
src/lib/actions/lesson-content-actions.ts-136-  data: {
src/lib/actions/lesson-content-actions.ts-137-    progress?: number;
src/lib/actions/lesson-content-actions.ts-138-    timeSpent?: number;
src/lib/actions/lesson-content-actions.ts-139-    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
--
src/lib/actions/lesson-content-actions.ts-248- * Mark content as completed
src/lib/actions/lesson-content-actions.ts-249- */
src/lib/actions/lesson-content-actions.ts:250:export async function completeContent(contentId: string) {
src/lib/actions/lesson-content-actions.ts-251-  return updateContentProgress(contentId, {
src/lib/actions/lesson-content-actions.ts-252-    progress: 100,
src/lib/actions/lesson-content-actions.ts-253-    status: 'COMPLETED'
src/lib/actions/lesson-content-actions.ts-254-  });
src/lib/actions/lesson-content-actions.ts-255-}
--
src/lib/actions/lesson-content-actions.ts-258- * Get student's overall learning progress
src/lib/actions/lesson-content-actions.ts-259- */
src/lib/actions/lesson-content-actions.ts:260:export async function getStudentLearningProgress(studentId?: string) {
src/lib/actions/lesson-content-actions.ts-261-  try {
src/lib/actions/lesson-content-actions.ts-262-    const session = await auth();
src/lib/actions/lesson-content-actions.ts-263-    if (!session?.user?.id) {
src/lib/actions/lesson-content-actions.ts-264-      throw new Error("Not authenticated");
src/lib/actions/lesson-content-actions.ts-265-    }
--
src/lib/actions/lesson-content-actions.ts-347- * Get recommended content for a student
src/lib/actions/lesson-content-actions.ts-348- */
src/lib/actions/lesson-content-actions.ts:349:export async function getRecommendedContent(limit: number = 5) {
src/lib/actions/lesson-content-actions.ts-350-  try {
src/lib/actions/lesson-content-actions.ts-351-    const session = await auth();
src/lib/actions/lesson-content-actions.ts-352-    if (!session?.user?.id) {
src/lib/actions/lesson-content-actions.ts-353-      throw new Error("Not authenticated");
src/lib/actions/lesson-content-actions.ts-354-    }
--
src/lib/actions/lesson-content-actions.ts-414- * Get learning streak for a student
src/lib/actions/lesson-content-actions.ts-415- */
src/lib/actions/lesson-content-actions.ts:416:export async function getLearningStreak(studentId?: string) {
src/lib/actions/lesson-content-actions.ts-417-  try {
src/lib/actions/lesson-content-actions.ts-418-    const session = await auth();
src/lib/actions/lesson-content-actions.ts-419-    if (!session?.user?.id) {
src/lib/actions/lesson-content-actions.ts-420-      throw new Error("Not authenticated");
src/lib/actions/lesson-content-actions.ts-421-    }
--
src/lib/actions/receiptVerificationActions.ts-19- * Requirements: 4.1, 4.2, 4.4
src/lib/actions/receiptVerificationActions.ts-20- */
src/lib/actions/receiptVerificationActions.ts:21:export async function getPendingReceipts(filters?: {
src/lib/actions/receiptVerificationActions.ts-22-  dateFrom?: Date;
src/lib/actions/receiptVerificationActions.ts-23-  dateTo?: Date;
src/lib/actions/receiptVerificationActions.ts-24-  limit?: number;
src/lib/actions/receiptVerificationActions.ts-25-  offset?: number;
src/lib/actions/receiptVerificationActions.ts-26-}) {
--
src/lib/actions/receiptVerificationActions.ts-143- * Requirements: 4.1, 4.2
src/lib/actions/receiptVerificationActions.ts-144- */
src/lib/actions/receiptVerificationActions.ts:145:export async function getVerificationStats() {
src/lib/actions/receiptVerificationActions.ts-146-  try {
src/lib/actions/receiptVerificationActions.ts-147-    // Get authenticated user
src/lib/actions/receiptVerificationActions.ts-148-    const session = await auth();
src/lib/actions/receiptVerificationActions.ts-149-    const userId = session?.user?.id;
src/lib/actions/receiptVerificationActions.ts-150-    if (!userId) {
--
src/lib/actions/receiptVerificationActions.ts-230- * Security: Rate limiting, admin authorization
src/lib/actions/receiptVerificationActions.ts-231- */
src/lib/actions/receiptVerificationActions.ts:232:export async function verifyReceipt(receiptId: string) {
src/lib/actions/receiptVerificationActions.ts-233-  try {
src/lib/actions/receiptVerificationActions.ts-234-    // Get authenticated user
src/lib/actions/receiptVerificationActions.ts-235-    const session = await auth();
src/lib/actions/receiptVerificationActions.ts-236-    const userId = session?.user?.id;
src/lib/actions/receiptVerificationActions.ts-237-    if (!userId) {
--
src/lib/actions/receiptVerificationActions.ts-469- * Security: Rate limiting, input sanitization, admin authorization
src/lib/actions/receiptVerificationActions.ts-470- */
src/lib/actions/receiptVerificationActions.ts:471:export async function rejectReceipt(
src/lib/actions/receiptVerificationActions.ts-472-  receiptId: string,
src/lib/actions/receiptVerificationActions.ts-473-  rejectionReason: string
src/lib/actions/receiptVerificationActions.ts-474-) {
src/lib/actions/receiptVerificationActions.ts-475-  try {
src/lib/actions/receiptVerificationActions.ts-476-    // Get authenticated user
--
src/lib/actions/receiptVerificationActions.ts-670- * Get verified receipts for admin with pagination
src/lib/actions/receiptVerificationActions.ts-671- */
src/lib/actions/receiptVerificationActions.ts:672:export async function getVerifiedReceipts(filters?: {
src/lib/actions/receiptVerificationActions.ts-673-  dateFrom?: Date;
src/lib/actions/receiptVerificationActions.ts-674-  dateTo?: Date;
src/lib/actions/receiptVerificationActions.ts-675-  limit?: number;
src/lib/actions/receiptVerificationActions.ts-676-  offset?: number;
src/lib/actions/receiptVerificationActions.ts-677-}) {
--
src/lib/actions/receiptVerificationActions.ts-780- * Get rejected receipts for admin with pagination
src/lib/actions/receiptVerificationActions.ts-781- */
src/lib/actions/receiptVerificationActions.ts:782:export async function getRejectedReceipts(filters?: {
src/lib/actions/receiptVerificationActions.ts-783-  dateFrom?: Date;
src/lib/actions/receiptVerificationActions.ts-784-  dateTo?: Date;
src/lib/actions/receiptVerificationActions.ts-785-  limit?: number;
src/lib/actions/receiptVerificationActions.ts-786-  offset?: number;
src/lib/actions/receiptVerificationActions.ts-787-}) {
--
src/lib/actions/receiptVerificationActions.ts-886- * Security: Rate limiting, admin authorization, transaction safety
src/lib/actions/receiptVerificationActions.ts-887- */
src/lib/actions/receiptVerificationActions.ts:888:export async function bulkVerifyReceipts(receiptIds: string[]) {
src/lib/actions/receiptVerificationActions.ts-889-  try {
src/lib/actions/receiptVerificationActions.ts-890-    // Get authenticated user
src/lib/actions/receiptVerificationActions.ts-891-    const session = await auth();
src/lib/actions/receiptVerificationActions.ts-892-    const userId = session?.user?.id;
src/lib/actions/receiptVerificationActions.ts-893-    if (!userId) {
--
src/lib/actions/receiptVerificationActions.ts-1051- * Security: Rate limiting, input sanitization, admin authorization
src/lib/actions/receiptVerificationActions.ts-1052- */
src/lib/actions/receiptVerificationActions.ts:1053:export async function bulkRejectReceipts(
src/lib/actions/receiptVerificationActions.ts-1054-  receiptIds: string[],
src/lib/actions/receiptVerificationActions.ts-1055-  rejectionReason: string
src/lib/actions/receiptVerificationActions.ts-1056-) {
src/lib/actions/receiptVerificationActions.ts-1057-  try {
src/lib/actions/receiptVerificationActions.ts-1058-    // Get authenticated user
--
src/lib/actions/emailActions.ts-28- * Send a single email message
src/lib/actions/emailActions.ts-29- */
src/lib/actions/emailActions.ts:30:export async function sendSingleEmail(data: {
src/lib/actions/emailActions.ts-31-  to: string;
src/lib/actions/emailActions.ts-32-  subject: string;
src/lib/actions/emailActions.ts-33-  html?: string;
src/lib/actions/emailActions.ts-34-  text?: string;
src/lib/actions/emailActions.ts-35-  replyTo?: string;
--
src/lib/actions/emailActions.ts-97- * Send bulk emails to multiple recipients
src/lib/actions/emailActions.ts-98- */
src/lib/actions/emailActions.ts:99:export async function sendBulkEmailAction(data: {
src/lib/actions/emailActions.ts-100-  recipients: string[];
src/lib/actions/emailActions.ts-101-  subject: string;
src/lib/actions/emailActions.ts-102-  html: string;
src/lib/actions/emailActions.ts-103-  text?: string;
src/lib/actions/emailActions.ts-104-}) {
--
src/lib/actions/emailActions.ts-170- * Send email to parents of a specific class
src/lib/actions/emailActions.ts-171- */
src/lib/actions/emailActions.ts:172:export async function sendEmailToClass(data: {
src/lib/actions/emailActions.ts-173-  classId: string;
src/lib/actions/emailActions.ts-174-  subject: string;
src/lib/actions/emailActions.ts-175-  html: string;
src/lib/actions/emailActions.ts-176-  text?: string;
src/lib/actions/emailActions.ts-177-}) {
--
src/lib/actions/emailActions.ts-261- * Send email to all parents
src/lib/actions/emailActions.ts-262- */
src/lib/actions/emailActions.ts:263:export async function sendEmailToAllParents(data: {
src/lib/actions/emailActions.ts-264-  subject: string;
src/lib/actions/emailActions.ts-265-  html: string;
src/lib/actions/emailActions.ts-266-  text?: string;
src/lib/actions/emailActions.ts-267-}) {
src/lib/actions/emailActions.ts-268-  try {
--
src/lib/actions/emailActions.ts-330- * Send email to all teachers
src/lib/actions/emailActions.ts-331- */
src/lib/actions/emailActions.ts:332:export async function sendEmailToAllTeachers(data: {
src/lib/actions/emailActions.ts-333-  subject: string;
src/lib/actions/emailActions.ts-334-  html: string;
src/lib/actions/emailActions.ts-335-  text?: string;
src/lib/actions/emailActions.ts-336-}) {
src/lib/actions/emailActions.ts-337-  try {
--
src/lib/actions/emailActions.ts-399- * Send templated email
src/lib/actions/emailActions.ts-400- */
src/lib/actions/emailActions.ts:401:export async function sendTemplatedEmailAction(data: {
src/lib/actions/emailActions.ts-402-  template: 'welcome' | 'password-reset' | 'admission-confirmation' | 'fee-reminder';
src/lib/actions/emailActions.ts-403-  to: string;
src/lib/actions/emailActions.ts-404-  templateData: Record<string, any>;
src/lib/actions/emailActions.ts-405-}) {
src/lib/actions/emailActions.ts-406-  try {
--
src/lib/actions/emailActions.ts-452- * Send admission confirmation email
src/lib/actions/emailActions.ts-453- */
src/lib/actions/emailActions.ts:454:export async function sendAdmissionConfirmationEmail(data: {
src/lib/actions/emailActions.ts-455-  parentEmail: string;
src/lib/actions/emailActions.ts-456-  parentName: string;
src/lib/actions/emailActions.ts-457-  studentName: string;
src/lib/actions/emailActions.ts-458-  applicationNumber: string;
src/lib/actions/emailActions.ts-459-}) {
--
src/lib/actions/emailActions.ts-503- * Check if email service is configured
src/lib/actions/emailActions.ts-504- */
src/lib/actions/emailActions.ts:505:export async function checkEmailConfiguration() {
src/lib/actions/emailActions.ts-506-  try {
src/lib/actions/emailActions.ts-507-    const user = await currentUser();
src/lib/actions/emailActions.ts-508-    if (!user) {
src/lib/actions/emailActions.ts-509-      return { success: false, error: "Unauthorized" };
src/lib/actions/emailActions.ts-510-    }
--
src/lib/actions/student-communication-actions.ts-71- * Requirements: 8.1
src/lib/actions/student-communication-actions.ts-72- */
src/lib/actions/student-communication-actions.ts:73:export async function getMessages(filters?: z.infer<typeof getMessagesSchema>) {
src/lib/actions/student-communication-actions.ts-74-  try {
src/lib/actions/student-communication-actions.ts-75-    // Get current student
src/lib/actions/student-communication-actions.ts-76-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-77-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-78-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-180- * Requirements: 8.2
src/lib/actions/student-communication-actions.ts-181- */
src/lib/actions/student-communication-actions.ts:182:export async function getAnnouncements(filters?: z.infer<typeof getAnnouncementsSchema>) {
src/lib/actions/student-communication-actions.ts-183-  try {
src/lib/actions/student-communication-actions.ts-184-    // Get current student
src/lib/actions/student-communication-actions.ts-185-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-186-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-187-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-277- * Requirements: 8.3, 8.4
src/lib/actions/student-communication-actions.ts-278- */
src/lib/actions/student-communication-actions.ts:279:export async function getNotifications(filters?: z.infer<typeof getNotificationsSchema>) {
src/lib/actions/student-communication-actions.ts-280-  try {
src/lib/actions/student-communication-actions.ts-281-    // Get current student
src/lib/actions/student-communication-actions.ts-282-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-283-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-284-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-397- * Requirements: 8.4
src/lib/actions/student-communication-actions.ts-398- */
src/lib/actions/student-communication-actions.ts:399:export async function markAsRead(input: z.infer<typeof markAsReadSchema>) {
src/lib/actions/student-communication-actions.ts-400-  try {
src/lib/actions/student-communication-actions.ts-401-    // Get current student
src/lib/actions/student-communication-actions.ts-402-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-403-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-404-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-490- * Requirements: 8.5
src/lib/actions/student-communication-actions.ts-491- */
src/lib/actions/student-communication-actions.ts:492:export async function getUnreadNotificationCount() {
src/lib/actions/student-communication-actions.ts-493-  try {
src/lib/actions/student-communication-actions.ts-494-    // Get current student
src/lib/actions/student-communication-actions.ts-495-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-496-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-497-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-524- * Requirements: 8.1
src/lib/actions/student-communication-actions.ts-525- */
src/lib/actions/student-communication-actions.ts:526:export async function getUnreadMessageCount() {
src/lib/actions/student-communication-actions.ts-527-  try {
src/lib/actions/student-communication-actions.ts-528-    // Get current student
src/lib/actions/student-communication-actions.ts-529-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-530-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-531-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-558- * Requirements: 8.5
src/lib/actions/student-communication-actions.ts-559- */
src/lib/actions/student-communication-actions.ts:560:export async function getTotalUnreadCount() {
src/lib/actions/student-communication-actions.ts-561-  try {
src/lib/actions/student-communication-actions.ts-562-    // Get current student
src/lib/actions/student-communication-actions.ts-563-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-564-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-565-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-604- * Requirements: 8.1
src/lib/actions/student-communication-actions.ts-605- */
src/lib/actions/student-communication-actions.ts:606:export async function getMessageById(id: string) {
src/lib/actions/student-communication-actions.ts-607-  try {
src/lib/actions/student-communication-actions.ts-608-    // Get current student
src/lib/actions/student-communication-actions.ts-609-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-610-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-611-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-660- * Requirements: 8.2
src/lib/actions/student-communication-actions.ts-661- */
src/lib/actions/student-communication-actions.ts:662:export async function getAnnouncementById(id: string) {
src/lib/actions/student-communication-actions.ts-663-  try {
src/lib/actions/student-communication-actions.ts-664-    // Get current student
src/lib/actions/student-communication-actions.ts-665-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-666-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-667-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-705- * Requirements: 8.4
src/lib/actions/student-communication-actions.ts-706- */
src/lib/actions/student-communication-actions.ts:707:export async function markAllNotificationsAsRead(type?: string) {
src/lib/actions/student-communication-actions.ts-708-  try {
src/lib/actions/student-communication-actions.ts-709-    // Get current student
src/lib/actions/student-communication-actions.ts-710-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-711-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-712-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-776- * Task 5.1
src/lib/actions/student-communication-actions.ts-777- */
src/lib/actions/student-communication-actions.ts:778:export async function sendMessage(data: z.infer<typeof sendMessageSchema>) {
src/lib/actions/student-communication-actions.ts-779-  try {
src/lib/actions/student-communication-actions.ts-780-    // Get current student
src/lib/actions/student-communication-actions.ts-781-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-782-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-783-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-885- * Task 5.1
src/lib/actions/student-communication-actions.ts-886- */
src/lib/actions/student-communication-actions.ts:887:export async function replyToMessage(data: z.infer<typeof replyToMessageSchema>) {
src/lib/actions/student-communication-actions.ts-888-  try {
src/lib/actions/student-communication-actions.ts-889-    // Get current student
src/lib/actions/student-communication-actions.ts-890-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-891-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-892-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-1011- * Task 5.1
src/lib/actions/student-communication-actions.ts-1012- */
src/lib/actions/student-communication-actions.ts:1013:export async function deleteMessage(data: z.infer<typeof deleteMessageSchema>) {
src/lib/actions/student-communication-actions.ts-1014-  try {
src/lib/actions/student-communication-actions.ts-1015-    // Get current student
src/lib/actions/student-communication-actions.ts-1016-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-1017-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-1018-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-1082- * Task 5.1
src/lib/actions/student-communication-actions.ts-1083- */
src/lib/actions/student-communication-actions.ts:1084:export async function uploadMessageAttachment(formData: FormData) {
src/lib/actions/student-communication-actions.ts-1085-  try {
src/lib/actions/student-communication-actions.ts-1086-    // Get current student
src/lib/actions/student-communication-actions.ts-1087-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-1088-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-1089-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/student-communication-actions.ts-1157- * Task 5.1
src/lib/actions/student-communication-actions.ts-1158- */
src/lib/actions/student-communication-actions.ts:1159:export async function getAvailableRecipients() {
src/lib/actions/student-communication-actions.ts-1160-  try {
src/lib/actions/student-communication-actions.ts-1161-    // Get current student
src/lib/actions/student-communication-actions.ts-1162-    const studentData = await getCurrentStudent();
src/lib/actions/student-communication-actions.ts-1163-    if (!studentData) {
src/lib/actions/student-communication-actions.ts-1164-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/subjectMarkConfigActions.ts-23- * Get all subject mark configurations for an exam
src/lib/actions/subjectMarkConfigActions.ts-24- */
src/lib/actions/subjectMarkConfigActions.ts:25:export async function getSubjectMarkConfigs(examId: string): Promise<ActionResult> {
src/lib/actions/subjectMarkConfigActions.ts-26-  try {
src/lib/actions/subjectMarkConfigActions.ts-27-    const configs = await db.subjectMarkConfig.findMany({
src/lib/actions/subjectMarkConfigActions.ts-28-      where: {
src/lib/actions/subjectMarkConfigActions.ts-29-        examId,
src/lib/actions/subjectMarkConfigActions.ts-30-      },
--
src/lib/actions/subjectMarkConfigActions.ts-65- * Get a single subject mark configuration
src/lib/actions/subjectMarkConfigActions.ts-66- */
src/lib/actions/subjectMarkConfigActions.ts:67:export async function getSubjectMarkConfig(id: string): Promise<ActionResult> {
src/lib/actions/subjectMarkConfigActions.ts-68-  try {
src/lib/actions/subjectMarkConfigActions.ts-69-    const config = await db.subjectMarkConfig.findUnique({
src/lib/actions/subjectMarkConfigActions.ts-70-      where: { id },
src/lib/actions/subjectMarkConfigActions.ts-71-      include: {
src/lib/actions/subjectMarkConfigActions.ts-72-        subject: {
--
src/lib/actions/subjectMarkConfigActions.ts-104- * Create or update subject mark configuration
src/lib/actions/subjectMarkConfigActions.ts-105- */
src/lib/actions/subjectMarkConfigActions.ts:106:export async function saveSubjectMarkConfig(input: SubjectMarkConfigInput): Promise<ActionResult> {
src/lib/actions/subjectMarkConfigActions.ts-107-  try {
src/lib/actions/subjectMarkConfigActions.ts-108-    // Validate that component sum equals total marks
src/lib/actions/subjectMarkConfigActions.ts-109-    const componentSum = 
src/lib/actions/subjectMarkConfigActions.ts-110-      (input.theoryMaxMarks || 0) + 
src/lib/actions/subjectMarkConfigActions.ts-111-      (input.practicalMaxMarks || 0) + 
--
src/lib/actions/subjectMarkConfigActions.ts-201- * Delete subject mark configuration
src/lib/actions/subjectMarkConfigActions.ts-202- */
src/lib/actions/subjectMarkConfigActions.ts:203:export async function deleteSubjectMarkConfig(id: string): Promise<ActionResult> {
src/lib/actions/subjectMarkConfigActions.ts-204-  try {
src/lib/actions/subjectMarkConfigActions.ts-205-    await db.subjectMarkConfig.delete({
src/lib/actions/subjectMarkConfigActions.ts-206-      where: { id },
src/lib/actions/subjectMarkConfigActions.ts-207-    });
src/lib/actions/subjectMarkConfigActions.ts-208-
--
src/lib/actions/subjectMarkConfigActions.ts-222- * Get all exams for dropdown selection
src/lib/actions/subjectMarkConfigActions.ts-223- */
src/lib/actions/subjectMarkConfigActions.ts:224:export async function getExamsForConfig(): Promise<ActionResult> {
src/lib/actions/subjectMarkConfigActions.ts-225-  try {
src/lib/actions/subjectMarkConfigActions.ts-226-    const exams = await db.exam.findMany({
src/lib/actions/subjectMarkConfigActions.ts-227-      select: {
src/lib/actions/subjectMarkConfigActions.ts-228-        id: true,
src/lib/actions/subjectMarkConfigActions.ts-229-        title: true,
--
src/lib/actions/subjectMarkConfigActions.ts-269- * Get subjects for an exam (based on exam's subject or all subjects)
src/lib/actions/subjectMarkConfigActions.ts-270- */
src/lib/actions/subjectMarkConfigActions.ts:271:export async function getSubjectsForExam(examId: string): Promise<ActionResult> {
src/lib/actions/subjectMarkConfigActions.ts-272-  try {
src/lib/actions/subjectMarkConfigActions.ts-273-    const exam = await db.exam.findUnique({
src/lib/actions/subjectMarkConfigActions.ts-274-      where: { id: examId },
src/lib/actions/subjectMarkConfigActions.ts-275-      select: {
src/lib/actions/subjectMarkConfigActions.ts-276-        subjectId: true,
--
src/lib/actions/teacherClassesActions.ts-9- * Get all classes taught by the current teacher
src/lib/actions/teacherClassesActions.ts-10- */
src/lib/actions/teacherClassesActions.ts:11:export async function getTeacherClasses() {
src/lib/actions/teacherClassesActions.ts-12-  try {
src/lib/actions/teacherClassesActions.ts-13-    const session = await auth();
src/lib/actions/teacherClassesActions.ts-14-    const userId = session?.user?.id;
src/lib/actions/teacherClassesActions.ts-15-
src/lib/actions/teacherClassesActions.ts-16-    if (!userId) {
--
src/lib/actions/teacherClassesActions.ts-142- * Get detailed information about a specific class
src/lib/actions/teacherClassesActions.ts-143- */
src/lib/actions/teacherClassesActions.ts:144:export async function getClassDetails(classId: string) {
src/lib/actions/teacherClassesActions.ts-145-  try {
src/lib/actions/teacherClassesActions.ts-146-    const session = await auth();
src/lib/actions/teacherClassesActions.ts-147-    const userId = session?.user?.id;
src/lib/actions/teacherClassesActions.ts-148-
src/lib/actions/teacherClassesActions.ts-149-    if (!userId) {
--
src/lib/actions/teacherClassesActions.ts-509- * Take attendance for a class
src/lib/actions/teacherClassesActions.ts-510- */
src/lib/actions/teacherClassesActions.ts:511:export async function markClassAttendance(classId: string, sectionId: string, attendanceData: {
src/lib/actions/teacherClassesActions.ts-512-  studentId: string;
src/lib/actions/teacherClassesActions.ts-513-  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
src/lib/actions/teacherClassesActions.ts-514-  reason?: string;
src/lib/actions/teacherClassesActions.ts-515-}[]) {
src/lib/actions/teacherClassesActions.ts-516-  try {
--
src/lib/actions/teacherClassesActions.ts-636- * Get students in a class section
src/lib/actions/teacherClassesActions.ts-637- */
src/lib/actions/teacherClassesActions.ts:638:export async function getClassStudents(classId: string, sectionId?: string) {
src/lib/actions/teacherClassesActions.ts-639-  try {
src/lib/actions/teacherClassesActions.ts-640-    const session = await auth();
src/lib/actions/teacherClassesActions.ts-641-    const userId = session?.user?.id;
src/lib/actions/teacherClassesActions.ts-642-
src/lib/actions/teacherClassesActions.ts-643-    if (!userId) {
--
src/lib/actions/teacherClassesActions.ts-712- * Get today's attendance for a class section
src/lib/actions/teacherClassesActions.ts-713- */
src/lib/actions/teacherClassesActions.ts:714:export async function getTodayAttendance(classId: string, sectionId: string) {
src/lib/actions/teacherClassesActions.ts-715-  try {
src/lib/actions/teacherClassesActions.ts-716-    const session = await auth();
src/lib/actions/teacherClassesActions.ts-717-    const userId = session?.user?.id;
src/lib/actions/teacherClassesActions.ts-718-
src/lib/actions/teacherClassesActions.ts-719-    if (!userId) {
--
src/lib/actions/student-settings-actions.ts-45-});
src/lib/actions/student-settings-actions.ts-46-
src/lib/actions/student-settings-actions.ts:47:export async function getStudentSettings(studentId: string) {
src/lib/actions/student-settings-actions.ts-48-  try {
src/lib/actions/student-settings-actions.ts-49-    // Check if StudentSettings table exists by trying to query it
src/lib/actions/student-settings-actions.ts-50-    const settings = await db.studentSettings.findUnique({
src/lib/actions/student-settings-actions.ts-51-      where: {
src/lib/actions/student-settings-actions.ts-52-        studentId: studentId
--
src/lib/actions/student-settings-actions.ts-142-}
src/lib/actions/student-settings-actions.ts-143-
src/lib/actions/student-settings-actions.ts:144:export async function updateAccountSettings(data: {
src/lib/actions/student-settings-actions.ts-145-  studentId: string;
src/lib/actions/student-settings-actions.ts-146-  email?: string;
src/lib/actions/student-settings-actions.ts-147-  phone?: string;
src/lib/actions/student-settings-actions.ts-148-  emergencyContact?: string;
src/lib/actions/student-settings-actions.ts-149-  emergencyPhone?: string;
--
src/lib/actions/student-settings-actions.ts-214-}
src/lib/actions/student-settings-actions.ts-215-
src/lib/actions/student-settings-actions.ts:216:export async function updateNotificationSettings(data: {
src/lib/actions/student-settings-actions.ts-217-  studentId: string;
src/lib/actions/student-settings-actions.ts-218-  emailNotifications?: boolean;
src/lib/actions/student-settings-actions.ts-219-  assignmentReminders?: boolean;
src/lib/actions/student-settings-actions.ts-220-  examReminders?: boolean;
src/lib/actions/student-settings-actions.ts-221-  attendanceAlerts?: boolean;
--
src/lib/actions/student-settings-actions.ts-300-}
src/lib/actions/student-settings-actions.ts-301-
src/lib/actions/student-settings-actions.ts:302:export async function updatePrivacySettings(data: {
src/lib/actions/student-settings-actions.ts-303-  studentId: string;
src/lib/actions/student-settings-actions.ts-304-  profileVisibility?: "PUBLIC" | "PRIVATE" | "CLASSMATES_ONLY";
src/lib/actions/student-settings-actions.ts-305-  showEmail?: boolean;
src/lib/actions/student-settings-actions.ts-306-  showPhone?: boolean;
src/lib/actions/student-settings-actions.ts-307-}) {
--
src/lib/actions/student-settings-actions.ts-365-}
src/lib/actions/student-settings-actions.ts-366-
src/lib/actions/student-settings-actions.ts:367:export async function updateAppearanceSettings(data: {
src/lib/actions/student-settings-actions.ts-368-  studentId: string;
src/lib/actions/student-settings-actions.ts-369-  theme?: "LIGHT" | "DARK" | "SYSTEM";
src/lib/actions/student-settings-actions.ts-370-  language?: string;
src/lib/actions/student-settings-actions.ts-371-  dateFormat?: string;
src/lib/actions/student-settings-actions.ts-372-  timeFormat?: "TWELVE_HOUR" | "TWENTY_FOUR_HOUR";
--
src/lib/actions/scheduledReportActions.ts-76- * Create a new scheduled report
src/lib/actions/scheduledReportActions.ts-77- */
src/lib/actions/scheduledReportActions.ts:78:export async function createScheduledReport(input: ScheduledReportInput) {
src/lib/actions/scheduledReportActions.ts-79-  try {
src/lib/actions/scheduledReportActions.ts-80-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scheduledReportActions.ts-81-    if (!schoolId) throw new Error("School context required");
src/lib/actions/scheduledReportActions.ts-82-    const session = await auth();
src/lib/actions/scheduledReportActions.ts-83-    const userId = session?.user?.id;
--
src/lib/actions/scheduledReportActions.ts-141- * Get all scheduled reports
src/lib/actions/scheduledReportActions.ts-142- */
src/lib/actions/scheduledReportActions.ts:143:export async function getScheduledReports() {
src/lib/actions/scheduledReportActions.ts-144-  try {
src/lib/actions/scheduledReportActions.ts-145-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scheduledReportActions.ts-146-    if (!schoolId) throw new Error("School context required");
src/lib/actions/scheduledReportActions.ts-147-    const session = await auth();
src/lib/actions/scheduledReportActions.ts-148-    const userId = session?.user?.id;
--
src/lib/actions/scheduledReportActions.ts-175- * Get a single scheduled report by ID
src/lib/actions/scheduledReportActions.ts-176- */
src/lib/actions/scheduledReportActions.ts:177:export async function getScheduledReport(id: string) {
src/lib/actions/scheduledReportActions.ts-178-  try {
src/lib/actions/scheduledReportActions.ts-179-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scheduledReportActions.ts-180-    if (!schoolId) throw new Error("School context required");
src/lib/actions/scheduledReportActions.ts-181-    const session = await auth();
src/lib/actions/scheduledReportActions.ts-182-    const userId = session?.user?.id;
--
src/lib/actions/scheduledReportActions.ts-212- * Update a scheduled report
src/lib/actions/scheduledReportActions.ts-213- */
src/lib/actions/scheduledReportActions.ts:214:export async function updateScheduledReport(id: string, input: ScheduledReportInput) {
src/lib/actions/scheduledReportActions.ts-215-  try {
src/lib/actions/scheduledReportActions.ts-216-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scheduledReportActions.ts-217-    if (!schoolId) throw new Error("School context required");
src/lib/actions/scheduledReportActions.ts-218-    const session = await auth();
src/lib/actions/scheduledReportActions.ts-219-    const userId = session?.user?.id;
--
src/lib/actions/scheduledReportActions.ts-276- * Delete a scheduled report
src/lib/actions/scheduledReportActions.ts-277- */
src/lib/actions/scheduledReportActions.ts:278:export async function deleteScheduledReport(id: string) {
src/lib/actions/scheduledReportActions.ts-279-  try {
src/lib/actions/scheduledReportActions.ts-280-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scheduledReportActions.ts-281-    if (!schoolId) throw new Error("School context required");
src/lib/actions/scheduledReportActions.ts-282-    const session = await auth();
src/lib/actions/scheduledReportActions.ts-283-    const userId = session?.user?.id;
--
src/lib/actions/scheduledReportActions.ts-306- * Toggle active status of a scheduled report
src/lib/actions/scheduledReportActions.ts-307- */
src/lib/actions/scheduledReportActions.ts:308:export async function toggleScheduledReportStatus(id: string, active: boolean) {
src/lib/actions/scheduledReportActions.ts-309-  try {
src/lib/actions/scheduledReportActions.ts-310-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/scheduledReportActions.ts-311-    if (!schoolId) throw new Error("School context required");
src/lib/actions/scheduledReportActions.ts-312-    const session = await auth();
src/lib/actions/scheduledReportActions.ts-313-    const userId = session?.user?.id;
--
src/lib/actions/scheduledReportActions.ts-351- * Update last run time and calculate next run time
src/lib/actions/scheduledReportActions.ts-352- */
src/lib/actions/scheduledReportActions.ts:353:export async function updateScheduledReportRunTime(id: string) {
src/lib/actions/scheduledReportActions.ts-354-  try {
src/lib/actions/scheduledReportActions.ts-355-    const report = await prisma.scheduledReport.findUnique({
src/lib/actions/scheduledReportActions.ts-356-      where: { id },
src/lib/actions/scheduledReportActions.ts-357-    });
src/lib/actions/scheduledReportActions.ts-358-
--
src/lib/actions/usersAction.ts-83-
src/lib/actions/usersAction.ts-84-// Create Administrator
src/lib/actions/usersAction.ts:85:export async function createAdministrator(data: CreateAdministratorFormData) {
src/lib/actions/usersAction.ts-86-  try {
src/lib/actions/usersAction.ts-87-    // Permission check: require USER:CREATE
src/lib/actions/usersAction.ts-88-    await checkPermission('USER', 'CREATE', 'You do not have permission to create administrators');
src/lib/actions/usersAction.ts-89-
src/lib/actions/usersAction.ts-90-    // Get current school context
--
src/lib/actions/usersAction.ts-153-
src/lib/actions/usersAction.ts-154-// Create Teacher
src/lib/actions/usersAction.ts:155:export async function createTeacher(data: CreateTeacherFormData) {
src/lib/actions/usersAction.ts-156-  try {
src/lib/actions/usersAction.ts-157-    // Permission check: require TEACHER:CREATE
src/lib/actions/usersAction.ts-158-    await checkPermission('TEACHER', 'CREATE', 'You do not have permission to create teachers');
src/lib/actions/usersAction.ts-159-
src/lib/actions/usersAction.ts-160-    // Get current school context
--
src/lib/actions/usersAction.ts-226-
src/lib/actions/usersAction.ts-227-// Create Student
src/lib/actions/usersAction.ts:228:export async function createStudent(data: CreateStudentFormData) {
src/lib/actions/usersAction.ts-229-  try {
src/lib/actions/usersAction.ts-230-    // Permission check: require STUDENT:CREATE
src/lib/actions/usersAction.ts-231-    await checkPermission('STUDENT', 'CREATE', 'You do not have permission to create students');
src/lib/actions/usersAction.ts-232-
src/lib/actions/usersAction.ts-233-    // Get current school context
--
src/lib/actions/usersAction.ts-337-
src/lib/actions/usersAction.ts-338-// Create Parent
src/lib/actions/usersAction.ts:339:export async function createParent(data: CreateParentFormData) {
src/lib/actions/usersAction.ts-340-  try {
src/lib/actions/usersAction.ts-341-    // Permission check: require PARENT:CREATE
src/lib/actions/usersAction.ts-342-    await checkPermission('PARENT', 'CREATE', 'You do not have permission to create parents');
src/lib/actions/usersAction.ts-343-
src/lib/actions/usersAction.ts-344-    // Get current school context
--
src/lib/actions/usersAction.ts-409-
src/lib/actions/usersAction.ts-410-// Associate a student with a parent
src/lib/actions/usersAction.ts:411:export async function associateStudentWithParent(studentId: string, parentId: string, isPrimary: boolean = false) {
src/lib/actions/usersAction.ts-412-  try {
src/lib/actions/usersAction.ts-413-    // Get current school context
src/lib/actions/usersAction.ts-414-    const context = await getCurrentUserSchoolContext();
src/lib/actions/usersAction.ts-415-    if (!context?.schoolId && !context?.isSuperAdmin) {
src/lib/actions/usersAction.ts-416-      throw new Error('School context required');
--
src/lib/actions/usersAction.ts-435-
src/lib/actions/usersAction.ts-436-// Update User details
src/lib/actions/usersAction.ts:437:export async function updateUserDetails(userId: string, userData: {
src/lib/actions/usersAction.ts-438-  firstName?: string;
src/lib/actions/usersAction.ts-439-  lastName?: string;
src/lib/actions/usersAction.ts-440-  email?: string;
src/lib/actions/usersAction.ts-441-  phone?: string;
src/lib/actions/usersAction.ts-442-  avatar?: string;
--
src/lib/actions/usersAction.ts-471-
src/lib/actions/usersAction.ts-472-// Update role-specific details
src/lib/actions/usersAction.ts:473:export async function updateAdministrator(administratorId: string, data: Partial<CreateAdministratorFormData> & { password?: string }) {
src/lib/actions/usersAction.ts-474-  try {
src/lib/actions/usersAction.ts-475-    const administrator = await db.administrator.findUnique({
src/lib/actions/usersAction.ts-476-      where: { id: administratorId },
src/lib/actions/usersAction.ts-477-      include: { user: true }
src/lib/actions/usersAction.ts-478-    });
--
src/lib/actions/usersAction.ts-526-
src/lib/actions/usersAction.ts-527-// Update Teacher
src/lib/actions/usersAction.ts:528:export async function updateTeacher(teacherId: string, data: Partial<CreateTeacherFormData> & { password?: string }) {
src/lib/actions/usersAction.ts-529-  try {
src/lib/actions/usersAction.ts-530-    const teacher = await db.teacher.findUnique({
src/lib/actions/usersAction.ts-531-      where: { id: teacherId },
src/lib/actions/usersAction.ts-532-      include: { user: true }
src/lib/actions/usersAction.ts-533-    });
--
src/lib/actions/usersAction.ts-584-
src/lib/actions/usersAction.ts-585-// Update Student
src/lib/actions/usersAction.ts:586:export async function updateStudent(studentId: string, data: Partial<CreateStudentFormData>) {
src/lib/actions/usersAction.ts-587-  try {
src/lib/actions/usersAction.ts-588-    const student = await db.student.findUnique({
src/lib/actions/usersAction.ts-589-      where: { id: studentId },
src/lib/actions/usersAction.ts-590-      include: { user: true }
src/lib/actions/usersAction.ts-591-    });
--
src/lib/actions/usersAction.ts-671-
src/lib/actions/usersAction.ts-672-// Update Parent
src/lib/actions/usersAction.ts:673:export async function updateParent(parentId: string, data: Partial<CreateParentFormData>) {
src/lib/actions/usersAction.ts-674-  try {
src/lib/actions/usersAction.ts-675-    const parent = await db.parent.findUnique({
src/lib/actions/usersAction.ts-676-      where: { id: parentId },
src/lib/actions/usersAction.ts-677-      include: { user: true }
src/lib/actions/usersAction.ts-678-    });
--
src/lib/actions/usersAction.ts-721-
src/lib/actions/usersAction.ts-722-// Sync Clerk user to our database
src/lib/actions/usersAction.ts:723:export async function syncClerkUser(clerkId: string, userData: {
src/lib/actions/usersAction.ts-724-  firstName: string;
src/lib/actions/usersAction.ts-725-  lastName: string;
src/lib/actions/usersAction.ts-726-  email: string;
src/lib/actions/usersAction.ts-727-  phone?: string;
src/lib/actions/usersAction.ts-728-  avatar?: string;
--
src/lib/actions/usersAction.ts-774-
src/lib/actions/usersAction.ts-775-// Delete user
src/lib/actions/usersAction.ts:776:export async function deleteUser(userId: string) {
src/lib/actions/usersAction.ts-777-  try {
src/lib/actions/usersAction.ts-778-    // Permission check: require USER:DELETE
src/lib/actions/usersAction.ts-779-    const currentUserId = await checkPermission('USER', 'DELETE', 'You do not have permission to delete users');
src/lib/actions/usersAction.ts-780-
src/lib/actions/usersAction.ts-781-    const user = await db.user.findUnique({
--
src/lib/actions/usersAction.ts-814-
src/lib/actions/usersAction.ts-815-// Get current authenticated user
src/lib/actions/usersAction.ts:816:export async function getCurrentUser() {
src/lib/actions/usersAction.ts-817-  const session = await auth();
src/lib/actions/usersAction.ts-818-  const userId = session?.user?.id;
src/lib/actions/usersAction.ts-819-
src/lib/actions/usersAction.ts-820-  if (!userId) {
src/lib/actions/usersAction.ts-821-    return null;
--
src/lib/actions/usersAction.ts-830-
src/lib/actions/usersAction.ts-831-// Get Student by ID
src/lib/actions/usersAction.ts:832:export async function getStudentById(studentId: string) {
src/lib/actions/usersAction.ts-833-  try {
src/lib/actions/usersAction.ts-834-    const student = await db.student.findUnique({
src/lib/actions/usersAction.ts-835-      where: { id: studentId },
src/lib/actions/usersAction.ts-836-      include: {
src/lib/actions/usersAction.ts-837-        user: true,
--
src/lib/actions/usersAction.ts-852-
src/lib/actions/usersAction.ts-853-// Get Teacher by ID
src/lib/actions/usersAction.ts:854:export async function getTeacherById(teacherId: string) {
src/lib/actions/usersAction.ts-855-  try {
src/lib/actions/usersAction.ts-856-    const teacher = await db.teacher.findUnique({
src/lib/actions/usersAction.ts-857-      where: { id: teacherId },
src/lib/actions/usersAction.ts-858-      include: { user: true }
src/lib/actions/usersAction.ts-859-    });
--
src/lib/actions/usersAction.ts-866-
src/lib/actions/usersAction.ts-867-// Get Administrator by ID
src/lib/actions/usersAction.ts:868:export async function getAdministratorById(administratorId: string) {
src/lib/actions/usersAction.ts-869-  try {
src/lib/actions/usersAction.ts-870-    const administrator = await db.administrator.findUnique({
src/lib/actions/usersAction.ts-871-      where: { id: administratorId },
src/lib/actions/usersAction.ts-872-      include: { user: true }
src/lib/actions/usersAction.ts-873-    });
--
src/lib/actions/usersAction.ts-880-
src/lib/actions/usersAction.ts-881-// Update user password
src/lib/actions/usersAction.ts:882:export async function updateUserPassword(userId: string, newPassword: string) {
src/lib/actions/usersAction.ts-883-  try {
src/lib/actions/usersAction.ts-884-    const session = await auth();
src/lib/actions/usersAction.ts-885-    const currentUserId = session?.user?.id;
src/lib/actions/usersAction.ts-886-    const currentUserRole = session?.user?.role;
src/lib/actions/usersAction.ts-887-
--
src/lib/actions/attendanceActions.ts-26-}
src/lib/actions/attendanceActions.ts-27-
src/lib/actions/attendanceActions.ts:28:export async function getAttendanceOverview() {
src/lib/actions/attendanceActions.ts-29-  try {
src/lib/actions/attendanceActions.ts-30-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-31-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-32-    const today = new Date();
src/lib/actions/attendanceActions.ts-33-    today.setHours(0, 0, 0, 0);
--
src/lib/actions/attendanceActions.ts-91-}
src/lib/actions/attendanceActions.ts-92-
src/lib/actions/attendanceActions.ts:93:export async function getWeeklyAttendanceTrend() {
src/lib/actions/attendanceActions.ts-94-  try {
src/lib/actions/attendanceActions.ts-95-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-96-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-97-    const today = new Date();
src/lib/actions/attendanceActions.ts-98-    const sevenDaysAgo = new Date(today);
--
src/lib/actions/attendanceActions.ts-147-}
src/lib/actions/attendanceActions.ts-148-
src/lib/actions/attendanceActions.ts:149:export async function getAttendanceByClass() {
src/lib/actions/attendanceActions.ts-150-  try {
src/lib/actions/attendanceActions.ts-151-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-152-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-153-    const today = new Date();
src/lib/actions/attendanceActions.ts-154-    const thirtyDaysAgo = new Date(today);
--
src/lib/actions/attendanceActions.ts-203-}
src/lib/actions/attendanceActions.ts-204-
src/lib/actions/attendanceActions.ts:205:export async function getRecentAbsences(limit: number = 10) {
src/lib/actions/attendanceActions.ts-206-  try {
src/lib/actions/attendanceActions.ts-207-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-208-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-209-    const twoDaysAgo = new Date();
src/lib/actions/attendanceActions.ts-210-    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
--
src/lib/actions/attendanceActions.ts-261-}
src/lib/actions/attendanceActions.ts-262-
src/lib/actions/attendanceActions.ts:263:export async function getAttendanceStats() {
src/lib/actions/attendanceActions.ts-264-  try {
src/lib/actions/attendanceActions.ts-265-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-266-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-267-    const today = new Date();
src/lib/actions/attendanceActions.ts-268-    today.setHours(0, 0, 0, 0);
--
src/lib/actions/attendanceActions.ts-317-}
src/lib/actions/attendanceActions.ts-318-
src/lib/actions/attendanceActions.ts:319:export async function getClassSectionsForDropdown() {
src/lib/actions/attendanceActions.ts-320-  try {
src/lib/actions/attendanceActions.ts-321-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-322-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-323-    const classes = await db.class.findMany({
src/lib/actions/attendanceActions.ts-324-      where: { schoolId },
--
src/lib/actions/attendanceActions.ts-349-}
src/lib/actions/attendanceActions.ts-350-
src/lib/actions/attendanceActions.ts:351:export async function getStudentAttendanceByDate(date: Date, sectionId?: string) {
src/lib/actions/attendanceActions.ts-352-  try {
src/lib/actions/attendanceActions.ts-353-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-354-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-355-    if (!sectionId) {
src/lib/actions/attendanceActions.ts-356-      return { success: false, error: "Section ID is required" };
--
src/lib/actions/attendanceActions.ts-441-}
src/lib/actions/attendanceActions.ts-442-
src/lib/actions/attendanceActions.ts:443:export async function markStudentAttendance(data: {
src/lib/actions/attendanceActions.ts-444-  studentId: string;
src/lib/actions/attendanceActions.ts-445-  sectionId: string;
src/lib/actions/attendanceActions.ts-446-  date: Date;
src/lib/actions/attendanceActions.ts-447-  status: AttendanceStatus;
src/lib/actions/attendanceActions.ts-448-  reason?: string;
--
src/lib/actions/attendanceActions.ts-559-}
src/lib/actions/attendanceActions.ts-560-
src/lib/actions/attendanceActions.ts:561:export async function markBulkStudentAttendance(data: {
src/lib/actions/attendanceActions.ts-562-  sectionId: string;
src/lib/actions/attendanceActions.ts-563-  date: Date;
src/lib/actions/attendanceActions.ts-564-  attendanceRecords: Array<{
src/lib/actions/attendanceActions.ts-565-    studentId: string;
src/lib/actions/attendanceActions.ts-566-    status: AttendanceStatus;
--
src/lib/actions/attendanceActions.ts-602-}
src/lib/actions/attendanceActions.ts-603-
src/lib/actions/attendanceActions.ts:604:export async function deleteStudentAttendance(id: string) {
src/lib/actions/attendanceActions.ts-605-  try {
src/lib/actions/attendanceActions.ts-606-    const { user, schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-607-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-608-
src/lib/actions/attendanceActions.ts-609-    const hasPerm = await hasPermission(user.id, 'ATTENDANCE', 'DELETE');
--
src/lib/actions/attendanceActions.ts-621-}
src/lib/actions/attendanceActions.ts-622-
src/lib/actions/attendanceActions.ts:623:export async function getStudentAttendanceReport(
src/lib/actions/attendanceActions.ts-624-  studentId: string,
src/lib/actions/attendanceActions.ts-625-  startDate?: Date,
src/lib/actions/attendanceActions.ts-626-  endDate?: Date
src/lib/actions/attendanceActions.ts-627-) {
src/lib/actions/attendanceActions.ts-628-  try {
--
src/lib/actions/attendanceActions.ts-684-}
src/lib/actions/attendanceActions.ts-685-
src/lib/actions/attendanceActions.ts:686:export async function getTeachersForDropdown() {
src/lib/actions/attendanceActions.ts-687-  try {
src/lib/actions/attendanceActions.ts-688-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-689-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-690-    const teachers = await db.teacher.findMany({
src/lib/actions/attendanceActions.ts-691-      where: {
--
src/lib/actions/attendanceActions.ts-720-}
src/lib/actions/attendanceActions.ts-721-
src/lib/actions/attendanceActions.ts:722:export async function getStudentsForDropdown() {
src/lib/actions/attendanceActions.ts-723-  try {
src/lib/actions/attendanceActions.ts-724-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-725-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-726-    const students = await db.student.findMany({
src/lib/actions/attendanceActions.ts-727-      where: {
--
src/lib/actions/attendanceActions.ts-767-}
src/lib/actions/attendanceActions.ts-768-
src/lib/actions/attendanceActions.ts:769:export async function getTeacherAttendanceByDate(date: Date) {
src/lib/actions/attendanceActions.ts-770-  try {
src/lib/actions/attendanceActions.ts-771-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/attendanceActions.ts-772-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/attendanceActions.ts-773-    const startOfDay = new Date(date);
src/lib/actions/attendanceActions.ts-774-    startOfDay.setHours(0, 0, 0, 0);
--
src/lib/actions/attendanceActions.ts-818-}
src/lib/actions/attendanceActions.ts-819-
src/lib/actions/attendanceActions.ts:820:export async function markTeacherAttendance(data: {
src/lib/actions/attendanceActions.ts-821-  teacherId: string;
src/lib/actions/attendanceActions.ts-822-  date: Date;
src/lib/actions/attendanceActions.ts-823-  status: AttendanceStatus;
src/lib/actions/attendanceActions.ts-824-  reason?: string;
src/lib/actions/attendanceActions.ts-825-  markedBy?: string;
--
src/lib/actions/attendanceActions.ts-877-}
src/lib/actions/attendanceActions.ts-878-
src/lib/actions/attendanceActions.ts:879:export async function markBulkTeacherAttendance(data: {
src/lib/actions/attendanceActions.ts-880-  date: Date;
src/lib/actions/attendanceActions.ts-881-  attendanceRecords: Array<{
src/lib/actions/attendanceActions.ts-882-    teacherId: string;
src/lib/actions/attendanceActions.ts-883-    status: AttendanceStatus;
src/lib/actions/attendanceActions.ts-884-    reason?: string;
--
src/lib/actions/auth-actions.ts-32- * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.8, 4.9
src/lib/actions/auth-actions.ts-33- */
src/lib/actions/auth-actions.ts:34:export async function loginAction({
src/lib/actions/auth-actions.ts-35-  email,
src/lib/actions/auth-actions.ts-36-  password,
src/lib/actions/auth-actions.ts-37-  totpCode,
src/lib/actions/auth-actions.ts-38-}: LoginParams): Promise<LoginResult> {
src/lib/actions/auth-actions.ts-39-  try {
--
src/lib/actions/auth-actions.ts-254-}
src/lib/actions/auth-actions.ts-255-
src/lib/actions/auth-actions.ts:256:export async function changePassword({
src/lib/actions/auth-actions.ts-257-  userId,
src/lib/actions/auth-actions.ts-258-  currentPassword,
src/lib/actions/auth-actions.ts-259-  newPassword,
src/lib/actions/auth-actions.ts-260-}: ChangePasswordParams) {
src/lib/actions/auth-actions.ts-261-  try {
--
src/lib/actions/school-management-actions.ts-17-}
src/lib/actions/school-management-actions.ts-18-
src/lib/actions/school-management-actions.ts:19:export async function getSchoolsWithFilters(filters: SchoolFilters = {}) {
src/lib/actions/school-management-actions.ts-20-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-21-
src/lib/actions/school-management-actions.ts-22-  try {
src/lib/actions/school-management-actions.ts-23-    const where: any = {};
src/lib/actions/school-management-actions.ts-24-
--
src/lib/actions/school-management-actions.ts-177-}
src/lib/actions/school-management-actions.ts-178-
src/lib/actions/school-management-actions.ts:179:export async function bulkUpdateSchoolStatus(schoolIds: string[], status: "ACTIVE" | "SUSPENDED") {
src/lib/actions/school-management-actions.ts-180-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-181-
src/lib/actions/school-management-actions.ts-182-  try {
src/lib/actions/school-management-actions.ts-183-    await db.school.updateMany({
src/lib/actions/school-management-actions.ts-184-      where: {
--
src/lib/actions/school-management-actions.ts-230-}
src/lib/actions/school-management-actions.ts-231-
src/lib/actions/school-management-actions.ts:232:export async function bulkDeleteSchools(schoolIds: string[]) {
src/lib/actions/school-management-actions.ts-233-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-234-
src/lib/actions/school-management-actions.ts-235-  try {
src/lib/actions/school-management-actions.ts-236-    // First, get school names for logging
src/lib/actions/school-management-actions.ts-237-    const schools = await db.school.findMany({
--
src/lib/actions/school-management-actions.ts-293-}
src/lib/actions/school-management-actions.ts-294-
src/lib/actions/school-management-actions.ts:295:export async function getSchoolDetails(schoolId: string) {
src/lib/actions/school-management-actions.ts-296-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-297-
src/lib/actions/school-management-actions.ts-298-  try {
src/lib/actions/school-management-actions.ts-299-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-300-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-381-}
src/lib/actions/school-management-actions.ts-382-
src/lib/actions/school-management-actions.ts:383:export async function updateSchoolStatus(schoolId: string, status: "ACTIVE" | "SUSPENDED") {
src/lib/actions/school-management-actions.ts-384-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-385-
src/lib/actions/school-management-actions.ts-386-  try {
src/lib/actions/school-management-actions.ts-387-    const school = await db.school.update({
src/lib/actions/school-management-actions.ts-388-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-434- * Requirements: 9.4 - WHEN a super admin resets onboarding, THE System SHALL set isOnboarded flag to false and clear onboarding progress
src/lib/actions/school-management-actions.ts-435- */
src/lib/actions/school-management-actions.ts:436:export async function resetSchoolOnboarding(schoolId: string) {
src/lib/actions/school-management-actions.ts-437-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-438-
src/lib/actions/school-management-actions.ts-439-  try {
src/lib/actions/school-management-actions.ts-440-    // Get current school state for logging
src/lib/actions/school-management-actions.ts-441-    const currentSchool = await db.school.findUnique({
--
src/lib/actions/school-management-actions.ts-521- * Requirements: 9.4 - Super admin controls for managing onboarding state
src/lib/actions/school-management-actions.ts-522- */
src/lib/actions/school-management-actions.ts:523:export async function launchSetupWizard(schoolId: string) {
src/lib/actions/school-management-actions.ts-524-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-525-
src/lib/actions/school-management-actions.ts-526-  try {
src/lib/actions/school-management-actions.ts-527-    // Get current school state
src/lib/actions/school-management-actions.ts-528-    const currentSchool = await db.school.findUnique({
--
src/lib/actions/school-management-actions.ts-599- * Requirements: 9.4 - Super admin controls for managing onboarding state
src/lib/actions/school-management-actions.ts-600- */
src/lib/actions/school-management-actions.ts:601:export async function getSchoolsOnboardingStatus(schoolIds: string[]) {
src/lib/actions/school-management-actions.ts-602-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-603-
src/lib/actions/school-management-actions.ts-604-  try {
src/lib/actions/school-management-actions.ts-605-    const schools = await db.school.findMany({
src/lib/actions/school-management-actions.ts-606-      where: {
--
src/lib/actions/school-management-actions.ts-642- * Requirements: 9.4 - Super admin controls for managing onboarding state
src/lib/actions/school-management-actions.ts-643- */
src/lib/actions/school-management-actions.ts:644:export async function bulkResetOnboarding(schoolIds: string[]) {
src/lib/actions/school-management-actions.ts-645-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-646-
src/lib/actions/school-management-actions.ts-647-  try {
src/lib/actions/school-management-actions.ts-648-    // Get current schools state for logging
src/lib/actions/school-management-actions.ts-649-    const currentSchools = await db.school.findMany({
--
src/lib/actions/school-management-actions.ts-785- * Update school basic settings
src/lib/actions/school-management-actions.ts-786- */
src/lib/actions/school-management-actions.ts:787:export async function updateSchoolSettings(schoolId: string, data: SchoolSettingsData) {
src/lib/actions/school-management-actions.ts-788-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-789-
src/lib/actions/school-management-actions.ts-790-  try {
src/lib/actions/school-management-actions.ts-791-    // Get current school for logging
src/lib/actions/school-management-actions.ts-792-    const currentSchool = await db.school.findUnique({
--
src/lib/actions/school-management-actions.ts-890- * Update school permissions
src/lib/actions/school-management-actions.ts-891- */
src/lib/actions/school-management-actions.ts:892:export async function updateSchoolPermissions(schoolId: string, data: SchoolPermissionsData) {
src/lib/actions/school-management-actions.ts-893-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-894-
src/lib/actions/school-management-actions.ts-895-  try {
src/lib/actions/school-management-actions.ts-896-    // Store permissions in school metadata
src/lib/actions/school-management-actions.ts-897-    const school = await db.school.findUnique({
--
src/lib/actions/school-management-actions.ts-960- * Update school usage limits
src/lib/actions/school-management-actions.ts-961- */
src/lib/actions/school-management-actions.ts:962:export async function updateSchoolUsageLimits(schoolId: string, data: SchoolUsageLimitsData) {
src/lib/actions/school-management-actions.ts-963-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-964-
src/lib/actions/school-management-actions.ts-965-  try {
src/lib/actions/school-management-actions.ts-966-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-967-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1029- * Update school notification settings
src/lib/actions/school-management-actions.ts-1030- */
src/lib/actions/school-management-actions.ts:1031:export async function updateSchoolNotificationSettings(schoolId: string, data: SchoolNotificationSettingsData) {
src/lib/actions/school-management-actions.ts-1032-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1033-
src/lib/actions/school-management-actions.ts-1034-  try {
src/lib/actions/school-management-actions.ts-1035-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1036-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1098- * Update school security settings
src/lib/actions/school-management-actions.ts-1099- */
src/lib/actions/school-management-actions.ts:1100:export async function updateSchoolSecuritySettings(schoolId: string, data: SchoolSecuritySettingsData) {
src/lib/actions/school-management-actions.ts-1101-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1102-
src/lib/actions/school-management-actions.ts-1103-  try {
src/lib/actions/school-management-actions.ts-1104-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1105-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1171- * Get comprehensive school analytics
src/lib/actions/school-management-actions.ts-1172- */
src/lib/actions/school-management-actions.ts:1173:export async function getSchoolAnalytics(schoolId: string) {
src/lib/actions/school-management-actions.ts-1174-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1175-
src/lib/actions/school-management-actions.ts-1176-  try {
src/lib/actions/school-management-actions.ts-1177-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1178-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1282- * Get school usage metrics
src/lib/actions/school-management-actions.ts-1283- */
src/lib/actions/school-management-actions.ts:1284:export async function getSchoolUsageMetrics(schoolId: string) {
src/lib/actions/school-management-actions.ts-1285-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1286-
src/lib/actions/school-management-actions.ts-1287-  try {
src/lib/actions/school-management-actions.ts-1288-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1289-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1364- * Get school activity log
src/lib/actions/school-management-actions.ts-1365- */
src/lib/actions/school-management-actions.ts:1366:export async function getSchoolActivityLog(schoolId: string, limit: number = 50) {
src/lib/actions/school-management-actions.ts-1367-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1368-
src/lib/actions/school-management-actions.ts-1369-  try {
src/lib/actions/school-management-actions.ts-1370-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1371-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1428- * Get school security status
src/lib/actions/school-management-actions.ts-1429- */
src/lib/actions/school-management-actions.ts:1430:export async function getSchoolSecurityStatus(schoolId: string) {
src/lib/actions/school-management-actions.ts-1431-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1432-
src/lib/actions/school-management-actions.ts-1433-  try {
src/lib/actions/school-management-actions.ts-1434-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1435-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1535- * Export school data
src/lib/actions/school-management-actions.ts-1536- */
src/lib/actions/school-management-actions.ts:1537:export async function exportSchoolData(schoolId: string, format: 'json' | 'csv' = 'json') {
src/lib/actions/school-management-actions.ts-1538-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1539-
src/lib/actions/school-management-actions.ts-1540-  try {
src/lib/actions/school-management-actions.ts-1541-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1542-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1628- * Get school data retention policy
src/lib/actions/school-management-actions.ts-1629- */
src/lib/actions/school-management-actions.ts:1630:export async function getSchoolDataRetentionPolicy(schoolId: string) {
src/lib/actions/school-management-actions.ts-1631-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1632-
src/lib/actions/school-management-actions.ts-1633-  try {
src/lib/actions/school-management-actions.ts-1634-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1635-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1680- * Update school data retention policy
src/lib/actions/school-management-actions.ts-1681- */
src/lib/actions/school-management-actions.ts:1682:export async function updateSchoolDataRetentionPolicy(schoolId: string, policy: any) {
src/lib/actions/school-management-actions.ts-1683-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1684-
src/lib/actions/school-management-actions.ts-1685-  try {
src/lib/actions/school-management-actions.ts-1686-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1687-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1758- * Clears all operational data but keeps school and administrators
src/lib/actions/school-management-actions.ts-1759- */
src/lib/actions/school-management-actions.ts:1760:export async function resetSchoolData(schoolId: string) {
src/lib/actions/school-management-actions.ts-1761-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1762-
src/lib/actions/school-management-actions.ts-1763-  try {
src/lib/actions/school-management-actions.ts-1764-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1765-      where: { id: schoolId },
--
src/lib/actions/school-management-actions.ts-1885- * Deletes School entity and all related data including Administrators
src/lib/actions/school-management-actions.ts-1886- */
src/lib/actions/school-management-actions.ts:1887:export async function deleteSchool(schoolId: string) {
src/lib/actions/school-management-actions.ts-1888-  await requireSuperAdminAccess();
src/lib/actions/school-management-actions.ts-1889-
src/lib/actions/school-management-actions.ts-1890-  try {
src/lib/actions/school-management-actions.ts-1891-    const school = await db.school.findUnique({
src/lib/actions/school-management-actions.ts-1892-      where: { id: schoolId },
--
src/lib/actions/studentExamActions.ts-11- * Get available online exams for a student
src/lib/actions/studentExamActions.ts-12- */
src/lib/actions/studentExamActions.ts:13:export async function getAvailableExamsForStudent() {
src/lib/actions/studentExamActions.ts-14-  try {
src/lib/actions/studentExamActions.ts-15-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/studentExamActions.ts-16-    if (!schoolId) throw new Error("School context required");
src/lib/actions/studentExamActions.ts-17-    const session = await auth();
src/lib/actions/studentExamActions.ts-18-    const userId = session?.user?.id;
--
src/lib/actions/studentExamActions.ts-84- * Start an exam attempt
src/lib/actions/studentExamActions.ts-85- */
src/lib/actions/studentExamActions.ts:86:export async function startExamAttempt(examId: string) {
src/lib/actions/studentExamActions.ts-87-  try {
src/lib/actions/studentExamActions.ts-88-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/studentExamActions.ts-89-    if (!schoolId) throw new Error("School context required");
src/lib/actions/studentExamActions.ts-90-    const session = await auth();
src/lib/actions/studentExamActions.ts-91-    const userId = session?.user?.id;
--
src/lib/actions/studentExamActions.ts-160- * Get exam attempt with questions
src/lib/actions/studentExamActions.ts-161- */
src/lib/actions/studentExamActions.ts:162:export async function getExamAttempt(examId: string) {
src/lib/actions/studentExamActions.ts-163-  try {
src/lib/actions/studentExamActions.ts-164-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/studentExamActions.ts-165-    if (!schoolId) throw new Error("School context required");
src/lib/actions/studentExamActions.ts-166-    const session = await auth();
src/lib/actions/studentExamActions.ts-167-    const userId = session?.user?.id;
--
src/lib/actions/studentExamActions.ts-244- * Save answer for a question
src/lib/actions/studentExamActions.ts-245- */
src/lib/actions/studentExamActions.ts:246:export async function saveAnswer(
src/lib/actions/studentExamActions.ts-247-  examId: string,
src/lib/actions/studentExamActions.ts-248-  questionId: string,
src/lib/actions/studentExamActions.ts-249-  answer: any
src/lib/actions/studentExamActions.ts-250-) {
src/lib/actions/studentExamActions.ts-251-  try {
--
src/lib/actions/studentExamActions.ts-308- * Submit exam attempt
src/lib/actions/studentExamActions.ts-309- */
src/lib/actions/studentExamActions.ts:310:export async function submitExamAttempt(
src/lib/actions/studentExamActions.ts-311-  examId: string,
src/lib/actions/studentExamActions.ts-312-  answers: Record<string, any>
src/lib/actions/studentExamActions.ts-313-) {
src/lib/actions/studentExamActions.ts-314-  try {
src/lib/actions/studentExamActions.ts-315-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/studentExamActions.ts-395- * Get student's exam results
src/lib/actions/studentExamActions.ts-396- */
src/lib/actions/studentExamActions.ts:397:export async function getStudentExamResults() {
src/lib/actions/studentExamActions.ts-398-  try {
src/lib/actions/studentExamActions.ts-399-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/studentExamActions.ts-400-    if (!schoolId) throw new Error("School context required");
src/lib/actions/studentExamActions.ts-401-    const session = await auth();
src/lib/actions/studentExamActions.ts-402-    const userId = session?.user?.id;
--
src/lib/actions/studentExamActions.ts-441- * Get detailed exam result with question-wise breakdown
src/lib/actions/studentExamActions.ts-442- */
src/lib/actions/studentExamActions.ts:443:export async function getDetailedExamResult(examId: string) {
src/lib/actions/studentExamActions.ts-444-  try {
src/lib/actions/studentExamActions.ts-445-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/studentExamActions.ts-446-    if (!schoolId) throw new Error("School context required");
src/lib/actions/studentExamActions.ts-447-    const session = await auth();
src/lib/actions/studentExamActions.ts-448-    const userId = session?.user?.id;
--
src/lib/actions/parent-communication-actions.ts-64- * Requirements: 2.1
src/lib/actions/parent-communication-actions.ts-65- */
src/lib/actions/parent-communication-actions.ts:66:export async function getMessages(filters: GetMessagesInput) {
src/lib/actions/parent-communication-actions.ts-67-  try {
src/lib/actions/parent-communication-actions.ts-68-    // Validate input
src/lib/actions/parent-communication-actions.ts-69-    const validated = getMessagesSchema.parse(filters);
src/lib/actions/parent-communication-actions.ts-70-
src/lib/actions/parent-communication-actions.ts-71-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-209- * Requirements: 2.1
src/lib/actions/parent-communication-actions.ts-210- */
src/lib/actions/parent-communication-actions.ts:211:export async function sendMessage(input: SendMessageInput & { csrfToken?: string }) {
src/lib/actions/parent-communication-actions.ts-212-  try {
src/lib/actions/parent-communication-actions.ts-213-    // Get current parent first for rate limiting
src/lib/actions/parent-communication-actions.ts-214-    const parentData = await getCurrentParent();
src/lib/actions/parent-communication-actions.ts-215-    if (!parentData) {
src/lib/actions/parent-communication-actions.ts-216-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-communication-actions.ts-331- * Requirements: 2.2
src/lib/actions/parent-communication-actions.ts-332- */
src/lib/actions/parent-communication-actions.ts:333:export async function getAnnouncements(filters: GetAnnouncementsInput) {
src/lib/actions/parent-communication-actions.ts-334-  try {
src/lib/actions/parent-communication-actions.ts-335-    // Validate input
src/lib/actions/parent-communication-actions.ts-336-    const validated = getAnnouncementsSchema.parse(filters);
src/lib/actions/parent-communication-actions.ts-337-
src/lib/actions/parent-communication-actions.ts-338-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-439- * Requirements: 2.3, 2.4
src/lib/actions/parent-communication-actions.ts-440- */
src/lib/actions/parent-communication-actions.ts:441:export async function getNotifications(filters: GetNotificationsInput) {
src/lib/actions/parent-communication-actions.ts-442-  try {
src/lib/actions/parent-communication-actions.ts-443-    // Validate input
src/lib/actions/parent-communication-actions.ts-444-    const validated = getNotificationsSchema.parse(filters);
src/lib/actions/parent-communication-actions.ts-445-
src/lib/actions/parent-communication-actions.ts-446-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-566- * Requirements: 2.1
src/lib/actions/parent-communication-actions.ts-567- */
src/lib/actions/parent-communication-actions.ts:568:export async function markMessageAsRead(input: MarkMessageAsReadInput) {
src/lib/actions/parent-communication-actions.ts-569-  try {
src/lib/actions/parent-communication-actions.ts-570-    // Validate input
src/lib/actions/parent-communication-actions.ts-571-    const validated = markMessageAsReadSchema.parse(input);
src/lib/actions/parent-communication-actions.ts-572-
src/lib/actions/parent-communication-actions.ts-573-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-628- * Requirements: 2.4
src/lib/actions/parent-communication-actions.ts-629- */
src/lib/actions/parent-communication-actions.ts:630:export async function markNotificationAsRead(input: MarkNotificationAsReadInput) {
src/lib/actions/parent-communication-actions.ts-631-  try {
src/lib/actions/parent-communication-actions.ts-632-    // Validate input
src/lib/actions/parent-communication-actions.ts-633-    const validated = markNotificationAsReadSchema.parse(input);
src/lib/actions/parent-communication-actions.ts-634-
src/lib/actions/parent-communication-actions.ts-635-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-690- * Requirements: 2.4
src/lib/actions/parent-communication-actions.ts-691- */
src/lib/actions/parent-communication-actions.ts:692:export async function markAllNotificationsAsRead(input?: MarkAllNotificationsAsReadInput) {
src/lib/actions/parent-communication-actions.ts-693-  try {
src/lib/actions/parent-communication-actions.ts-694-    // Validate input if provided
src/lib/actions/parent-communication-actions.ts-695-    const validated = input ? markAllNotificationsAsReadSchema.parse(input) : undefined;
src/lib/actions/parent-communication-actions.ts-696-
src/lib/actions/parent-communication-actions.ts-697-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-743- * Requirements: 2.1
src/lib/actions/parent-communication-actions.ts-744- */
src/lib/actions/parent-communication-actions.ts:745:export async function deleteMessage(input: DeleteMessageInput) {
src/lib/actions/parent-communication-actions.ts-746-  try {
src/lib/actions/parent-communication-actions.ts-747-    // Validate input
src/lib/actions/parent-communication-actions.ts-748-    const validated = deleteMessageSchema.parse(input);
src/lib/actions/parent-communication-actions.ts-749-
src/lib/actions/parent-communication-actions.ts-750-    // Get current parent
--
src/lib/actions/parent-communication-actions.ts-805- * Requirements: 2.5
src/lib/actions/parent-communication-actions.ts-806- */
src/lib/actions/parent-communication-actions.ts:807:export async function getUnreadMessageCount() {
src/lib/actions/parent-communication-actions.ts-808-  try {
src/lib/actions/parent-communication-actions.ts-809-    // Get current parent
src/lib/actions/parent-communication-actions.ts-810-    const parentData = await getCurrentParent();
src/lib/actions/parent-communication-actions.ts-811-    if (!parentData) {
src/lib/actions/parent-communication-actions.ts-812-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-communication-actions.ts-840- * Requirements: 2.5
src/lib/actions/parent-communication-actions.ts-841- */
src/lib/actions/parent-communication-actions.ts:842:export async function getUnreadNotificationCount() {
src/lib/actions/parent-communication-actions.ts-843-  try {
src/lib/actions/parent-communication-actions.ts-844-    // Get current parent
src/lib/actions/parent-communication-actions.ts-845-    const parentData = await getCurrentParent();
src/lib/actions/parent-communication-actions.ts-846-    if (!parentData) {
src/lib/actions/parent-communication-actions.ts-847-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-communication-actions.ts-875- * Requirements: 2.5
src/lib/actions/parent-communication-actions.ts-876- */
src/lib/actions/parent-communication-actions.ts:877:export async function getTotalUnreadCount() {
src/lib/actions/parent-communication-actions.ts-878-  try {
src/lib/actions/parent-communication-actions.ts-879-    // Get current parent
src/lib/actions/parent-communication-actions.ts-880-    const parentData = await getCurrentParent();
src/lib/actions/parent-communication-actions.ts-881-    if (!parentData) {
src/lib/actions/parent-communication-actions.ts-882-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-communication-actions.ts-923- * Requirements: 2.1
src/lib/actions/parent-communication-actions.ts-924- */
src/lib/actions/parent-communication-actions.ts:925:export async function getAvailableRecipients() {
src/lib/actions/parent-communication-actions.ts-926-  try {
src/lib/actions/parent-communication-actions.ts-927-    // Get current parent
src/lib/actions/parent-communication-actions.ts-928-    const parentData = await getCurrentParent();
src/lib/actions/parent-communication-actions.ts-929-    if (!parentData) {
src/lib/actions/parent-communication-actions.ts-930-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/timetableConfigActions.ts-7-
src/lib/actions/timetableConfigActions.ts-8-// Get the current timetable configuration
src/lib/actions/timetableConfigActions.ts:9:export async function getTimetableConfig() {
src/lib/actions/timetableConfigActions.ts-10-  try {
src/lib/actions/timetableConfigActions.ts-11-    // Get the active configuration or create a default one if none exists
src/lib/actions/timetableConfigActions.ts-12-    let config = await db.timetableConfig.findFirst({
src/lib/actions/timetableConfigActions.ts-13-      where: { isActive: true },
src/lib/actions/timetableConfigActions.ts-14-      include: {
--
src/lib/actions/timetableConfigActions.ts-67-
src/lib/actions/timetableConfigActions.ts-68-// Save/update timetable configuration
src/lib/actions/timetableConfigActions.ts:69:export async function saveTimetableConfig(data: TimetableConfigFormValues) {
src/lib/actions/timetableConfigActions.ts-70-  console.log("Server received data:", data);
src/lib/actions/timetableConfigActions.ts-71-  
src/lib/actions/timetableConfigActions.ts-72-  try {
src/lib/actions/timetableConfigActions.ts-73-    // Get school context
src/lib/actions/timetableConfigActions.ts-74-    const schoolId = await getRequiredSchoolId();
--
src/lib/actions/parent-settings-actions.ts-54- * Cached for 10 minutes (600 seconds) as per requirements 9.5
src/lib/actions/parent-settings-actions.ts-55- */
src/lib/actions/parent-settings-actions.ts:56:export async function getSettings(input?: GetSettingsInput, schoolId?: string) {
src/lib/actions/parent-settings-actions.ts-57-  try {
src/lib/actions/parent-settings-actions.ts-58-    // Get current parent
src/lib/actions/parent-settings-actions.ts-59-    const parentData = await getCurrentParent();
src/lib/actions/parent-settings-actions.ts-60-    if (!parentData) {
src/lib/actions/parent-settings-actions.ts-61-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-settings-actions.ts-168- * Requirements: 6.1, 6.2
src/lib/actions/parent-settings-actions.ts-169- */
src/lib/actions/parent-settings-actions.ts:170:export async function updateProfile(input: UpdateProfileInput) {
src/lib/actions/parent-settings-actions.ts-171-  try {
src/lib/actions/parent-settings-actions.ts-172-    // Validate input
src/lib/actions/parent-settings-actions.ts-173-    const validated = updateProfileSchema.parse(input);
src/lib/actions/parent-settings-actions.ts-174-    
src/lib/actions/parent-settings-actions.ts-175-    // Get current parent
--
src/lib/actions/parent-settings-actions.ts-234- * Requirements: 6.4
src/lib/actions/parent-settings-actions.ts-235- */
src/lib/actions/parent-settings-actions.ts:236:export async function changePassword(input: ChangePasswordInput) {
src/lib/actions/parent-settings-actions.ts-237-  try {
src/lib/actions/parent-settings-actions.ts-238-    // Validate input
src/lib/actions/parent-settings-actions.ts-239-    const validated = changePasswordSchema.parse(input);
src/lib/actions/parent-settings-actions.ts-240-    
src/lib/actions/parent-settings-actions.ts-241-    // Get current parent
--
src/lib/actions/parent-settings-actions.ts-280- * Requirements: 6.3
src/lib/actions/parent-settings-actions.ts-281- */
src/lib/actions/parent-settings-actions.ts:282:export async function updateNotificationPreferences(input: UpdateNotificationPreferencesInput, schoolId: string) {
src/lib/actions/parent-settings-actions.ts-283-  try {
src/lib/actions/parent-settings-actions.ts-284-    // Validate input
src/lib/actions/parent-settings-actions.ts-285-    const validated = updateNotificationPreferencesSchema.parse(input);
src/lib/actions/parent-settings-actions.ts-286-    
src/lib/actions/parent-settings-actions.ts-287-    // Get current parent
--
src/lib/actions/parent-settings-actions.ts-358- * Requirements: 6.5, 10.1, 10.2, 10.4
src/lib/actions/parent-settings-actions.ts-359- */
src/lib/actions/parent-settings-actions.ts:360:export async function uploadAvatar(formData: FormData) {
src/lib/actions/parent-settings-actions.ts-361-  try {
src/lib/actions/parent-settings-actions.ts-362-    // Get current parent
src/lib/actions/parent-settings-actions.ts-363-    const parentData = await getCurrentParent();
src/lib/actions/parent-settings-actions.ts-364-    if (!parentData) {
src/lib/actions/parent-settings-actions.ts-365-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/parent-settings-actions.ts-428- * Requirements: 6.5
src/lib/actions/parent-settings-actions.ts-429- */
src/lib/actions/parent-settings-actions.ts:430:export async function updateAvatarUrl(input: AvatarUrlInput) {
src/lib/actions/parent-settings-actions.ts-431-  try {
src/lib/actions/parent-settings-actions.ts-432-    // Validate input
src/lib/actions/parent-settings-actions.ts-433-    const validated = avatarUrlSchema.parse(input);
src/lib/actions/parent-settings-actions.ts-434-    
src/lib/actions/parent-settings-actions.ts-435-    // Get current parent
--
src/lib/actions/parent-settings-actions.ts-474- * Requirements: 6.5, 7.4
src/lib/actions/parent-settings-actions.ts-475- */
src/lib/actions/parent-settings-actions.ts:476:export async function removeAvatar() {
src/lib/actions/parent-settings-actions.ts-477-  try {
src/lib/actions/parent-settings-actions.ts-478-    // Get current parent
src/lib/actions/parent-settings-actions.ts-479-    const parentData = await getCurrentParent();
src/lib/actions/parent-settings-actions.ts-480-    if (!parentData) {
src/lib/actions/parent-settings-actions.ts-481-      return { success: false, message: "Unauthorized" };
--
src/lib/actions/onlineExamActions.ts-9- * Get teacher's subjects for online exam creation
src/lib/actions/onlineExamActions.ts-10- */
src/lib/actions/onlineExamActions.ts:11:export async function getTeacherSubjectsForExam() {
src/lib/actions/onlineExamActions.ts-12-  try {
src/lib/actions/onlineExamActions.ts-13-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/onlineExamActions.ts-14-    if (!schoolId) throw new Error("School context required");
src/lib/actions/onlineExamActions.ts-15-
src/lib/actions/onlineExamActions.ts-16-    const session = await auth();
--
src/lib/actions/onlineExamActions.ts-48- * Get classes for online exam creation
src/lib/actions/onlineExamActions.ts-49- */
src/lib/actions/onlineExamActions.ts:50:export async function getClassesForExam() {
src/lib/actions/onlineExamActions.ts-51-  try {
src/lib/actions/onlineExamActions.ts-52-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/onlineExamActions.ts-53-    if (!schoolId) throw new Error("School context missing");
src/lib/actions/onlineExamActions.ts-54-
src/lib/actions/onlineExamActions.ts-55-    const classes = await prisma.class.findMany({
--
src/lib/actions/onlineExamActions.ts-73- * Get question banks for a subject with filtering
src/lib/actions/onlineExamActions.ts-74- */
src/lib/actions/onlineExamActions.ts:75:export async function getQuestionBanks(filters: {
src/lib/actions/onlineExamActions.ts-76-  subjectId: string;
src/lib/actions/onlineExamActions.ts-77-  topic?: string;
src/lib/actions/onlineExamActions.ts-78-  difficulty?: string;
src/lib/actions/onlineExamActions.ts-79-  questionType?: string;
src/lib/actions/onlineExamActions.ts-80-}) {
--
src/lib/actions/onlineExamActions.ts-123- * Get unique topics for a subject
src/lib/actions/onlineExamActions.ts-124- */
src/lib/actions/onlineExamActions.ts:125:export async function getSubjectTopics(subjectId: string) {
src/lib/actions/onlineExamActions.ts-126-  try {
src/lib/actions/onlineExamActions.ts-127-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/onlineExamActions.ts-128-    if (!schoolId) throw new Error("School context required");
src/lib/actions/onlineExamActions.ts-129-
src/lib/actions/onlineExamActions.ts-130-    const questions = await prisma.questionBank.findMany({
--
src/lib/actions/onlineExamActions.ts-155- * Create a new online exam
src/lib/actions/onlineExamActions.ts-156- */
src/lib/actions/onlineExamActions.ts:157:export async function createOnlineExam(data: {
src/lib/actions/onlineExamActions.ts-158-  title: string;
src/lib/actions/onlineExamActions.ts-159-  subjectId: string;
src/lib/actions/onlineExamActions.ts-160-  classId: string;
src/lib/actions/onlineExamActions.ts-161-  duration: number;
src/lib/actions/onlineExamActions.ts-162-  totalMarks: number;
--
src/lib/actions/onlineExamActions.ts-260- * Get online exams created by teacher
src/lib/actions/onlineExamActions.ts-261- */
src/lib/actions/onlineExamActions.ts:262:export async function getTeacherOnlineExams() {
src/lib/actions/onlineExamActions.ts-263-  try {
src/lib/actions/onlineExamActions.ts-264-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/onlineExamActions.ts-265-    if (!schoolId) throw new Error("School context required");
src/lib/actions/onlineExamActions.ts-266-    const session = await auth();
src/lib/actions/onlineExamActions.ts-267-    const userId = session?.user?.id;
--
src/lib/actions/onlineExamActions.ts-304- * Get online exam by ID
src/lib/actions/onlineExamActions.ts-305- */
src/lib/actions/onlineExamActions.ts:306:export async function getOnlineExamById(examId: string) {
src/lib/actions/onlineExamActions.ts-307-  try {
src/lib/actions/onlineExamActions.ts-308-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/onlineExamActions.ts-309-    if (!schoolId) throw new Error("School context required");
src/lib/actions/onlineExamActions.ts-310-
src/lib/actions/onlineExamActions.ts-311-    // Note: We use findFirst with schoolId filter instead of findUnique to ensure isolation
--
src/lib/actions/onlineExamActions.ts-363- * Select random questions from question bank based on criteria
src/lib/actions/onlineExamActions.ts-364- */
src/lib/actions/onlineExamActions.ts:365:export async function selectRandomQuestions(criteria: {
src/lib/actions/onlineExamActions.ts-366-  subjectId: string;
src/lib/actions/onlineExamActions.ts-367-  count: number;
src/lib/actions/onlineExamActions.ts-368-  topic?: string;
src/lib/actions/onlineExamActions.ts-369-  difficulty?: string;
src/lib/actions/onlineExamActions.ts-370-  questionType?: string;
--
src/lib/actions/onlineExamActions.ts-416- * Manually grade essay questions for an exam attempt
src/lib/actions/onlineExamActions.ts-417- */
src/lib/actions/onlineExamActions.ts:418:export async function gradeEssayQuestions(
src/lib/actions/onlineExamActions.ts-419-  attemptId: string,
src/lib/actions/onlineExamActions.ts-420-  questionScores: Record<string, number>
src/lib/actions/onlineExamActions.ts-421-) {
src/lib/actions/onlineExamActions.ts-422-  try {
src/lib/actions/onlineExamActions.ts-423-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/parent-children-actions.ts-61- * Cached for 5 minutes (300 seconds) as per requirements 9.5
src/lib/actions/parent-children-actions.ts-62- */
src/lib/actions/parent-children-actions.ts:63:export async function getMyChildren() {
src/lib/actions/parent-children-actions.ts-64-  const result = await getCurrentParent();
src/lib/actions/parent-children-actions.ts-65-
src/lib/actions/parent-children-actions.ts-66-  if (!result) {
src/lib/actions/parent-children-actions.ts-67-    redirect("/login");
src/lib/actions/parent-children-actions.ts-68-  }
--
src/lib/actions/parent-children-actions.ts-188- * Get detailed information about a specific child
src/lib/actions/parent-children-actions.ts-189- */
src/lib/actions/parent-children-actions.ts:190:export async function getChildDetails(childId: string) {
src/lib/actions/parent-children-actions.ts-191-  const result = await getCurrentParent();
src/lib/actions/parent-children-actions.ts-192-
src/lib/actions/parent-children-actions.ts-193-  if (!result) {
src/lib/actions/parent-children-actions.ts-194-    redirect("/login");
src/lib/actions/parent-children-actions.ts-195-  }
--
src/lib/actions/parent-children-actions.ts-438- * Set a parent as the primary parent for a child
src/lib/actions/parent-children-actions.ts-439- */
src/lib/actions/parent-children-actions.ts:440:export async function setPrimaryParent(formData: FormData) {
src/lib/actions/parent-children-actions.ts-441-  const result = await getCurrentParent();
src/lib/actions/parent-children-actions.ts-442-
src/lib/actions/parent-children-actions.ts-443-  if (!result) {
src/lib/actions/parent-children-actions.ts-444-    return { success: false, message: "Authentication required" };
src/lib/actions/parent-children-actions.ts-445-  }
--
src/lib/actions/reportBuilderActions.ts-73- * Generate report data based on configuration
src/lib/actions/reportBuilderActions.ts-74- */
src/lib/actions/reportBuilderActions.ts:75:export async function generateReport(config: ReportConfig) {
src/lib/actions/reportBuilderActions.ts-76-  try {
src/lib/actions/reportBuilderActions.ts-77-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/reportBuilderActions.ts-78-    if (!schoolId) throw new Error("School context required");
src/lib/actions/reportBuilderActions.ts-79-    const session = await auth();
src/lib/actions/reportBuilderActions.ts-80-    const userId = session?.user?.id;
--
src/lib/actions/reportBuilderActions.ts-458- * Save report configuration
src/lib/actions/reportBuilderActions.ts-459- */
src/lib/actions/reportBuilderActions.ts:460:export async function saveReportConfig(config: ReportConfig) {
src/lib/actions/reportBuilderActions.ts-461-  try {
src/lib/actions/reportBuilderActions.ts-462-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/reportBuilderActions.ts-463-    if (!schoolId) throw new Error("School context required");
src/lib/actions/reportBuilderActions.ts-464-    const session = await auth();
src/lib/actions/reportBuilderActions.ts-465-    const userId = session?.user?.id;
--
src/lib/actions/reportBuilderActions.ts-491- * Process data for chart visualization
src/lib/actions/reportBuilderActions.ts-492- */
src/lib/actions/reportBuilderActions.ts:493:export async function processChartData(data: any[], chartConfig: ChartConfig) {
src/lib/actions/reportBuilderActions.ts-494-  if (!chartConfig.enabled || !data || data.length === 0) {
src/lib/actions/reportBuilderActions.ts-495-    return [];
src/lib/actions/reportBuilderActions.ts-496-  }
src/lib/actions/reportBuilderActions.ts-497-
src/lib/actions/reportBuilderActions.ts-498-  const { xAxisField, yAxisField, aggregation, groupBy } = chartConfig;
--
src/lib/actions/reportBuilderActions.ts-553- * This is a server action that prepares data for client-side export
src/lib/actions/reportBuilderActions.ts-554- */
src/lib/actions/reportBuilderActions.ts:555:export async function exportReportData(
src/lib/actions/reportBuilderActions.ts-556-  config: ReportConfig,
src/lib/actions/reportBuilderActions.ts-557-  format: 'pdf' | 'excel' | 'csv'
src/lib/actions/reportBuilderActions.ts-558-) {
src/lib/actions/reportBuilderActions.ts-559-  try {
src/lib/actions/reportBuilderActions.ts-560-    const { schoolId } = await requireSchoolAccess();
--
src/lib/actions/reportBuilderActions.ts-594- * Generate year-over-year comparative analysis
src/lib/actions/reportBuilderActions.ts-595- */
src/lib/actions/reportBuilderActions.ts:596:export async function generateYearOverYearComparison(
src/lib/actions/reportBuilderActions.ts-597-  config: ComparativeAnalysisConfig
src/lib/actions/reportBuilderActions.ts-598-): Promise<{ success: boolean; data?: ComparisonResult; error?: string }> {
src/lib/actions/reportBuilderActions.ts-599-  try {
src/lib/actions/reportBuilderActions.ts-600-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/reportBuilderActions.ts-601-    if (!schoolId) throw new Error("School context required");
--
src/lib/actions/reportBuilderActions.ts-706- * Generate term-over-term comparative analysis
src/lib/actions/reportBuilderActions.ts-707- */
src/lib/actions/reportBuilderActions.ts:708:export async function generateTermOverTermComparison(
src/lib/actions/reportBuilderActions.ts-709-  config: ComparativeAnalysisConfig
src/lib/actions/reportBuilderActions.ts-710-): Promise<{ success: boolean; data?: ComparisonResult; error?: string }> {
src/lib/actions/reportBuilderActions.ts-711-  try {
src/lib/actions/reportBuilderActions.ts-712-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/reportBuilderActions.ts-713-    if (!schoolId) throw new Error("School context required");
--
src/lib/actions/reportBuilderActions.ts-1070- * Get available academic years for comparison
src/lib/actions/reportBuilderActions.ts-1071- */
src/lib/actions/reportBuilderActions.ts:1072:export async function getAvailableAcademicYears() {
src/lib/actions/reportBuilderActions.ts-1073-  try {
src/lib/actions/reportBuilderActions.ts-1074-    const session = await auth();
src/lib/actions/reportBuilderActions.ts-1075-    const userId = session?.user?.id;
src/lib/actions/reportBuilderActions.ts-1076-    if (!userId) {
src/lib/actions/reportBuilderActions.ts-1077-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/reportBuilderActions.ts-1099- * Get available terms for comparison
src/lib/actions/reportBuilderActions.ts-1100- */
src/lib/actions/reportBuilderActions.ts:1101:export async function getAvailableTerms(academicYearId?: string) {
src/lib/actions/reportBuilderActions.ts-1102-  try {
src/lib/actions/reportBuilderActions.ts-1103-    const session = await auth();
src/lib/actions/reportBuilderActions.ts-1104-    const userId = session?.user?.id;
src/lib/actions/reportBuilderActions.ts-1105-    if (!userId) {
src/lib/actions/reportBuilderActions.ts-1106-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/paymentConfigActions.ts-23- * Requirements: 7.1, 7.2, 7.3
src/lib/actions/paymentConfigActions.ts-24- */
src/lib/actions/paymentConfigActions.ts:25:export async function getPaymentConfig() {
src/lib/actions/paymentConfigActions.ts-26-  try {
src/lib/actions/paymentConfigActions.ts-27-    // Get required school context - CRITICAL for multi-tenancy
src/lib/actions/paymentConfigActions.ts-28-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/paymentConfigActions.ts-29-    const schoolId = await getRequiredSchoolId();
src/lib/actions/paymentConfigActions.ts-30-    
--
src/lib/actions/paymentConfigActions.ts-67- * Requirements: 7.1, 7.2, 7.3
src/lib/actions/paymentConfigActions.ts-68- */
src/lib/actions/paymentConfigActions.ts:69:export async function updatePaymentConfig(config: Partial<PaymentConfigType>) {
src/lib/actions/paymentConfigActions.ts-70-  try {
src/lib/actions/paymentConfigActions.ts-71-    // Authentication check
src/lib/actions/paymentConfigActions.ts-72-    const session = await auth();
src/lib/actions/paymentConfigActions.ts-73-    const userId = session?.user?.id;
src/lib/actions/paymentConfigActions.ts-74-    if (!userId) {
--
src/lib/actions/settingsActions.ts-9-
src/lib/actions/settingsActions.ts-10-// Get system settings (creates default if doesn't exist)
src/lib/actions/settingsActions.ts:11:export async function getSystemSettings() {
src/lib/actions/settingsActions.ts-12-  try {
src/lib/actions/settingsActions.ts-13-    // Authentication check
src/lib/actions/settingsActions.ts-14-    const session = await auth();
src/lib/actions/settingsActions.ts-15-    const userId = session?.user?.id;
src/lib/actions/settingsActions.ts-16-    if (!userId) {
--
src/lib/actions/settingsActions.ts-69-// Get system settings without authentication (for public use in layouts)
src/lib/actions/settingsActions.ts-70-// This now uses the cached version directly
src/lib/actions/settingsActions.ts:71:export async function getPublicSystemSettings() {
src/lib/actions/settingsActions.ts-72-  try {
src/lib/actions/settingsActions.ts-73-    // Try to get school from subdomain for public access
src/lib/actions/settingsActions.ts-74-    const { getSchoolFromSubdomain } = await import('@/lib/utils/subdomain-helper');
src/lib/actions/settingsActions.ts-75-    
src/lib/actions/settingsActions.ts-76-    let school;
--
src/lib/actions/settingsActions.ts-129-
src/lib/actions/settingsActions.ts-130-// Update school information
src/lib/actions/settingsActions.ts:131:export async function updateSchoolInfo(data: {
src/lib/actions/settingsActions.ts-132-  schoolName: string;
src/lib/actions/settingsActions.ts-133-  schoolEmail?: string;
src/lib/actions/settingsActions.ts-134-  schoolPhone?: string;
src/lib/actions/settingsActions.ts-135-  schoolAddress?: string;
src/lib/actions/settingsActions.ts-136-  schoolWebsite?: string;
--
src/lib/actions/settingsActions.ts-215-
src/lib/actions/settingsActions.ts-216-// Legacy function for backward compatibility
src/lib/actions/settingsActions.ts:217:export async function updateGeneralSettings(data: {
src/lib/actions/settingsActions.ts-218-  schoolName: string;
src/lib/actions/settingsActions.ts-219-  schoolEmail?: string;
src/lib/actions/settingsActions.ts-220-  schoolPhone?: string;
src/lib/actions/settingsActions.ts-221-  schoolAddress?: string;
src/lib/actions/settingsActions.ts-222-  schoolWebsite?: string;
--
src/lib/actions/settingsActions.ts-228-
src/lib/actions/settingsActions.ts-229-// Update academic settings
src/lib/actions/settingsActions.ts:230:export async function updateAcademicSettings(data: {
src/lib/actions/settingsActions.ts-231-  currentAcademicYear?: string;
src/lib/actions/settingsActions.ts-232-  currentTerm?: string;
src/lib/actions/settingsActions.ts-233-  defaultGradingScale: string;
src/lib/actions/settingsActions.ts-234-  passingGrade: number;
src/lib/actions/settingsActions.ts-235-  autoAttendance: boolean;
--
src/lib/actions/settingsActions.ts-292-
src/lib/actions/settingsActions.ts-293-// Update notification settings
src/lib/actions/settingsActions.ts:294:export async function updateNotificationSettings(data: {
src/lib/actions/settingsActions.ts-295-  emailEnabled: boolean;
src/lib/actions/settingsActions.ts-296-  smsEnabled: boolean;
src/lib/actions/settingsActions.ts-297-  pushEnabled: boolean;
src/lib/actions/settingsActions.ts-298-  notifyEnrollment: boolean;
src/lib/actions/settingsActions.ts-299-  notifyPayment: boolean;
--
src/lib/actions/settingsActions.ts-370-
src/lib/actions/settingsActions.ts-371-// Update security settings
src/lib/actions/settingsActions.ts:372:export async function updateSecuritySettings(data: {
src/lib/actions/settingsActions.ts-373-  twoFactorAuth: boolean;
src/lib/actions/settingsActions.ts-374-  sessionTimeout: number;
src/lib/actions/settingsActions.ts-375-  passwordExpiry: number;
src/lib/actions/settingsActions.ts-376-  passwordMinLength: number;
src/lib/actions/settingsActions.ts-377-  passwordRequireSpecialChar: boolean;
--
src/lib/actions/settingsActions.ts-422-
src/lib/actions/settingsActions.ts-423-// Update appearance settings
src/lib/actions/settingsActions.ts:424:export async function updateAppearanceSettings(data: {
src/lib/actions/settingsActions.ts-425-  defaultTheme: string;
src/lib/actions/settingsActions.ts-426-  defaultColorTheme: string;
src/lib/actions/settingsActions.ts-427-  primaryColor: string;
src/lib/actions/settingsActions.ts-428-  secondaryColor?: string;
src/lib/actions/settingsActions.ts-429-  accentColor?: string;
--
src/lib/actions/settingsActions.ts-487-
src/lib/actions/settingsActions.ts-488-// Trigger manual backup
src/lib/actions/settingsActions.ts:489:export async function triggerBackup() {
src/lib/actions/settingsActions.ts-490-  try {
src/lib/actions/settingsActions.ts-491-    // Authentication check
src/lib/actions/settingsActions.ts-492-    const session = await auth();
src/lib/actions/settingsActions.ts-493-    const userId = session?.user?.id;
src/lib/actions/settingsActions.ts-494-    if (!userId) {
--
src/lib/actions/examAnalyticsActions.ts-7- * Get comprehensive analytics for an online exam
src/lib/actions/examAnalyticsActions.ts-8- */
src/lib/actions/examAnalyticsActions.ts:9:export async function getExamAnalytics(examId: string) {
src/lib/actions/examAnalyticsActions.ts-10-  try {
src/lib/actions/examAnalyticsActions.ts-11-    const session = await auth();
src/lib/actions/examAnalyticsActions.ts-12-    const userId = session?.user?.id;
src/lib/actions/examAnalyticsActions.ts-13-    if (!userId) {
src/lib/actions/examAnalyticsActions.ts-14-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/examAnalyticsActions.ts-273- * Get question-wise detailed analysis for an exam
src/lib/actions/examAnalyticsActions.ts-274- */
src/lib/actions/examAnalyticsActions.ts:275:export async function getQuestionWiseAnalysis(examId: string, questionId: string) {
src/lib/actions/examAnalyticsActions.ts-276-  try {
src/lib/actions/examAnalyticsActions.ts-277-    const session = await auth();
src/lib/actions/examAnalyticsActions.ts-278-    const userId = session?.user?.id;
src/lib/actions/examAnalyticsActions.ts-279-    if (!userId) {
src/lib/actions/examAnalyticsActions.ts-280-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/examAnalyticsActions.ts-415- * Get comparative analytics across multiple exams
src/lib/actions/examAnalyticsActions.ts-416- */
src/lib/actions/examAnalyticsActions.ts:417:export async function getComparativeExamAnalytics(examIds: string[]) {
src/lib/actions/examAnalyticsActions.ts-418-  try {
src/lib/actions/examAnalyticsActions.ts-419-    const session = await auth();
src/lib/actions/examAnalyticsActions.ts-420-    const userId = session?.user?.id;
src/lib/actions/examAnalyticsActions.ts-421-    if (!userId) {
src/lib/actions/examAnalyticsActions.ts-422-      return { success: false, error: "Unauthorized" };
--
src/lib/actions/parent-attendance-actions.ts-9- * Get attendance records for a specific child within a date range
src/lib/actions/parent-attendance-actions.ts-10- */
src/lib/actions/parent-attendance-actions.ts:11:export async function getChildAttendance(
src/lib/actions/parent-attendance-actions.ts-12-  childId: string, 
src/lib/actions/parent-attendance-actions.ts-13-  startDate: Date, 
src/lib/actions/parent-attendance-actions.ts-14-  endDate: Date
src/lib/actions/parent-attendance-actions.ts-15-) {
src/lib/actions/parent-attendance-actions.ts-16-  // Add school isolation
--
src/lib/actions/parent-attendance-actions.ts-83- * Get attendance summary for a specific child
src/lib/actions/parent-attendance-actions.ts-84- */
src/lib/actions/parent-attendance-actions.ts:85:export async function getChildAttendanceSummary(childId: string) {
src/lib/actions/parent-attendance-actions.ts-86-  // Get attendance for the current academic year
src/lib/actions/parent-attendance-actions.ts-87-  const currentDate = new Date();
src/lib/actions/parent-attendance-actions.ts-88-  const academicYearStart = new Date(currentDate.getFullYear(), 6, 1); // July 1st of current year
src/lib/actions/parent-attendance-actions.ts-89-  const academicYearEnd = new Date(currentDate.getFullYear() + 1, 5, 30); // June 30th of next year
src/lib/actions/parent-attendance-actions.ts-90-  
--
src/lib/actions/parent-attendance-actions.ts-119- * Get attendance summary statistics for all children of a parent
src/lib/actions/parent-attendance-actions.ts-120- */
src/lib/actions/parent-attendance-actions.ts:121:export async function getChildrenAttendanceSummary() {
src/lib/actions/parent-attendance-actions.ts-122-  // Add school isolation
src/lib/actions/parent-attendance-actions.ts-123-  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parent-attendance-actions.ts-124-  const schoolId = await getRequiredSchoolId();
src/lib/actions/parent-attendance-actions.ts-125-
src/lib/actions/parent-attendance-actions.ts-126-  // Verify the current user is a parent
--
src/lib/actions/receiptWidgetActions.ts-8- * Get receipt verification widget data for admin dashboard
src/lib/actions/receiptWidgetActions.ts-9- */
src/lib/actions/receiptWidgetActions.ts:10:export async function getReceiptWidgetData() {
src/lib/actions/receiptWidgetActions.ts-11-  try {
src/lib/actions/receiptWidgetActions.ts-12-    // Get required school context
src/lib/actions/receiptWidgetActions.ts-13-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/receiptWidgetActions.ts-14-    const schoolId = await getRequiredSchoolId();
src/lib/actions/receiptWidgetActions.ts-15-
--
src/lib/actions/receiptWidgetActions.ts-187- * Get comprehensive analytics for receipt dashboard
src/lib/actions/receiptWidgetActions.ts-188- */
src/lib/actions/receiptWidgetActions.ts:189:export async function getReceiptAnalytics() {
src/lib/actions/receiptWidgetActions.ts-190-  try {
src/lib/actions/receiptWidgetActions.ts-191-    // Get required school context
src/lib/actions/receiptWidgetActions.ts-192-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/receiptWidgetActions.ts-193-    const schoolId = await getRequiredSchoolId();
src/lib/actions/receiptWidgetActions.ts-194-
--
src/lib/actions/notificationActions.ts-9-
src/lib/actions/notificationActions.ts-10-// Get all notifications with filters
src/lib/actions/notificationActions.ts:11:export async function getNotifications(filters?: {
src/lib/actions/notificationActions.ts-12-  type?: string;
src/lib/actions/notificationActions.ts-13-  recipientRole?: string;
src/lib/actions/notificationActions.ts-14-  limit?: number;
src/lib/actions/notificationActions.ts-15-}) {
src/lib/actions/notificationActions.ts-16-  try {
--
src/lib/actions/notificationActions.ts-60-
src/lib/actions/notificationActions.ts-61-// Get single notification by ID
src/lib/actions/notificationActions.ts:62:export async function getNotificationById(id: string) {
src/lib/actions/notificationActions.ts-63-  try {
src/lib/actions/notificationActions.ts-64-    const user = await currentUser();
src/lib/actions/notificationActions.ts-65-    if (!user) {
src/lib/actions/notificationActions.ts-66-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-67-    }
--
src/lib/actions/notificationActions.ts-100-
src/lib/actions/notificationActions.ts-101-// Create new notification (Broadcast capable)
src/lib/actions/notificationActions.ts:102:export async function createNotification(data: any) {
src/lib/actions/notificationActions.ts-103-  try {
src/lib/actions/notificationActions.ts-104-    const user = await currentUser();
src/lib/actions/notificationActions.ts-105-    if (!user) {
src/lib/actions/notificationActions.ts-106-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-107-    }
--
src/lib/actions/notificationActions.ts-171-
src/lib/actions/notificationActions.ts-172-// Update notification
src/lib/actions/notificationActions.ts:173:export async function updateNotification(id: string, data: any) {
src/lib/actions/notificationActions.ts-174-  try {
src/lib/actions/notificationActions.ts-175-    const user = await currentUser();
src/lib/actions/notificationActions.ts-176-    if (!user) {
src/lib/actions/notificationActions.ts-177-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-178-    }
--
src/lib/actions/notificationActions.ts-211-
src/lib/actions/notificationActions.ts-212-// Delete notification
src/lib/actions/notificationActions.ts:213:export async function deleteNotification(id: string) {
src/lib/actions/notificationActions.ts-214-  try {
src/lib/actions/notificationActions.ts-215-    const user = await currentUser();
src/lib/actions/notificationActions.ts-216-    if (!user) {
src/lib/actions/notificationActions.ts-217-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-218-    }
--
src/lib/actions/notificationActions.ts-236-
src/lib/actions/notificationActions.ts-237-// Get notifications for current user
src/lib/actions/notificationActions.ts:238:export async function getUserNotifications() {
src/lib/actions/notificationActions.ts-239-  try {
src/lib/actions/notificationActions.ts-240-    const user = await currentUser();
src/lib/actions/notificationActions.ts-241-    if (!user) {
src/lib/actions/notificationActions.ts-242-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-243-    }
--
src/lib/actions/notificationActions.ts-269-
src/lib/actions/notificationActions.ts-270-// Mark notification as read
src/lib/actions/notificationActions.ts:271:export async function markNotificationAsRead(notificationId: string) {
src/lib/actions/notificationActions.ts-272-  try {
src/lib/actions/notificationActions.ts-273-    const user = await currentUser();
src/lib/actions/notificationActions.ts-274-    if (!user) {
src/lib/actions/notificationActions.ts-275-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-276-    }
--
src/lib/actions/notificationActions.ts-314-
src/lib/actions/notificationActions.ts-315-// Mark all notifications as read for current user
src/lib/actions/notificationActions.ts:316:export async function markAllNotificationsAsRead() {
src/lib/actions/notificationActions.ts-317-  try {
src/lib/actions/notificationActions.ts-318-    const user = await currentUser();
src/lib/actions/notificationActions.ts-319-    if (!user) {
src/lib/actions/notificationActions.ts-320-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-321-    }
--
src/lib/actions/notificationActions.ts-349-
src/lib/actions/notificationActions.ts-350-// Send bulk notifications to specific users
src/lib/actions/notificationActions.ts:351:export async function sendBulkNotifications(userIds: string[], data: any) {
src/lib/actions/notificationActions.ts-352-  try {
src/lib/actions/notificationActions.ts-353-    const user = await currentUser();
src/lib/actions/notificationActions.ts-354-    if (!user) {
src/lib/actions/notificationActions.ts-355-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-356-    }
--
src/lib/actions/notificationActions.ts-395-
src/lib/actions/notificationActions.ts-396-// Get notification statistics
src/lib/actions/notificationActions.ts:397:export async function getNotificationStats() {
src/lib/actions/notificationActions.ts-398-  try {
src/lib/actions/notificationActions.ts-399-    const user = await currentUser();
src/lib/actions/notificationActions.ts-400-    if (!user) {
src/lib/actions/notificationActions.ts-401-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-402-    }
--
src/lib/actions/notificationActions.ts-445-
src/lib/actions/notificationActions.ts-446-// Get users for bulk notification targeting
src/lib/actions/notificationActions.ts:447:export async function getUsersForNotifications(role?: string) {
src/lib/actions/notificationActions.ts-448-  try {
src/lib/actions/notificationActions.ts-449-    const user = await currentUser();
src/lib/actions/notificationActions.ts-450-    if (!user) {
src/lib/actions/notificationActions.ts-451-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-452-    }
--
src/lib/actions/notificationActions.ts-487-
src/lib/actions/notificationActions.ts-488-// Get notification preferences for current user
src/lib/actions/notificationActions.ts:489:export async function getNotificationPreferences() {
src/lib/actions/notificationActions.ts-490-  try {
src/lib/actions/notificationActions.ts-491-    const user = await currentUser();
src/lib/actions/notificationActions.ts-492-    if (!user) {
src/lib/actions/notificationActions.ts-493-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-494-    }
--
src/lib/actions/notificationActions.ts-555-
src/lib/actions/notificationActions.ts-556-// Update notification preferences for current user
src/lib/actions/notificationActions.ts:557:export async function updateNotificationPreferences(preferences: any) {
src/lib/actions/notificationActions.ts-558-  try {
src/lib/actions/notificationActions.ts-559-    const user = await currentUser();
src/lib/actions/notificationActions.ts-560-    if (!user) {
src/lib/actions/notificationActions.ts-561-      return { success: false, error: "Unauthorized" };
src/lib/actions/notificationActions.ts-562-    }
--
src/lib/actions/export-actions.ts-15- * Export students data (server-side for large datasets)
src/lib/actions/export-actions.ts-16- */
src/lib/actions/export-actions.ts:17:export async function exportStudentsData(
src/lib/actions/export-actions.ts-18-  filters?: {
src/lib/actions/export-actions.ts-19-    classId?: string;
src/lib/actions/export-actions.ts-20-    sectionId?: string;
src/lib/actions/export-actions.ts-21-    status?: string;
src/lib/actions/export-actions.ts-22-    searchQuery?: string;
--
src/lib/actions/export-actions.ts-100- * Export teachers data
src/lib/actions/export-actions.ts-101- */
src/lib/actions/export-actions.ts:102:export async function exportTeachersData(
src/lib/actions/export-actions.ts-103-  filters?: {
src/lib/actions/export-actions.ts-104-    departmentId?: string;
src/lib/actions/export-actions.ts-105-    status?: string;
src/lib/actions/export-actions.ts-106-    searchQuery?: string;
src/lib/actions/export-actions.ts-107-  }
--
src/lib/actions/export-actions.ts-172- * Export attendance data
src/lib/actions/export-actions.ts-173- */
src/lib/actions/export-actions.ts:174:export async function exportAttendanceData(
src/lib/actions/export-actions.ts-175-  startDate: Date,
src/lib/actions/export-actions.ts-176-  endDate: Date,
src/lib/actions/export-actions.ts-177-  filters?: {
src/lib/actions/export-actions.ts-178-    classId?: string;
src/lib/actions/export-actions.ts-179-    sectionId?: string;
--
src/lib/actions/export-actions.ts-251- * Export fee payments data
src/lib/actions/export-actions.ts-252- */
src/lib/actions/export-actions.ts:253:export async function exportFeePaymentsData(
src/lib/actions/export-actions.ts-254-  startDate: Date,
src/lib/actions/export-actions.ts-255-  endDate: Date,
src/lib/actions/export-actions.ts-256-  filters?: {
src/lib/actions/export-actions.ts-257-    status?: string;
src/lib/actions/export-actions.ts-258-    classId?: string;
--
src/lib/actions/export-actions.ts-334- * Export exam results data
src/lib/actions/export-actions.ts-335- */
src/lib/actions/export-actions.ts:336:export async function exportExamResultsData(
src/lib/actions/export-actions.ts-337-  examId: string
src/lib/actions/export-actions.ts-338-): Promise<ExportJobResult> {
src/lib/actions/export-actions.ts-339-  try {
src/lib/actions/export-actions.ts-340-    const session = await auth();
src/lib/actions/export-actions.ts-341-    const userId = session?.user?.id;
--
src/lib/actions/performanceAnalyticsActions.ts-4-
src/lib/actions/performanceAnalyticsActions.ts-5-// Get performance analytics
src/lib/actions/performanceAnalyticsActions.ts:6:export async function getPerformanceAnalytics(filters?: {
src/lib/actions/performanceAnalyticsActions.ts-7-  classId?: string;
src/lib/actions/performanceAnalyticsActions.ts-8-  subjectId?: string;
src/lib/actions/performanceAnalyticsActions.ts-9-  dateFrom?: Date;
src/lib/actions/performanceAnalyticsActions.ts-10-  dateTo?: Date;
src/lib/actions/performanceAnalyticsActions.ts-11-}) {
--
src/lib/actions/performanceAnalyticsActions.ts-92-
src/lib/actions/performanceAnalyticsActions.ts-93-// Get subject-wise performance
src/lib/actions/performanceAnalyticsActions.ts:94:export async function getSubjectWisePerformance(classId?: string) {
src/lib/actions/performanceAnalyticsActions.ts-95-  try {
src/lib/actions/performanceAnalyticsActions.ts-96-    // CRITICAL: Add school isolation
src/lib/actions/performanceAnalyticsActions.ts-97-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/performanceAnalyticsActions.ts-98-    const schoolId = await getRequiredSchoolId();
src/lib/actions/performanceAnalyticsActions.ts-99-
--
src/lib/actions/performanceAnalyticsActions.ts-159-
src/lib/actions/performanceAnalyticsActions.ts-160-// Get pass/fail rates
src/lib/actions/performanceAnalyticsActions.ts:161:export async function getPassFailRates(classId?: string) {
src/lib/actions/performanceAnalyticsActions.ts-162-  try {
src/lib/actions/performanceAnalyticsActions.ts-163-    // CRITICAL: Add school isolation
src/lib/actions/performanceAnalyticsActions.ts-164-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/performanceAnalyticsActions.ts-165-    const schoolId = await getRequiredSchoolId();
src/lib/actions/performanceAnalyticsActions.ts-166-
--
src/lib/actions/performanceAnalyticsActions.ts-211-
src/lib/actions/performanceAnalyticsActions.ts-212-// Get performance trends
src/lib/actions/performanceAnalyticsActions.ts:213:export async function getPerformanceTrends(dateFrom: Date, dateTo: Date, classId?: string) {
src/lib/actions/performanceAnalyticsActions.ts-214-  try {
src/lib/actions/performanceAnalyticsActions.ts-215-    // CRITICAL: Add school isolation
src/lib/actions/performanceAnalyticsActions.ts-216-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/performanceAnalyticsActions.ts-217-    const schoolId = await getRequiredSchoolId();
src/lib/actions/performanceAnalyticsActions.ts-218-
--
src/lib/actions/performanceAnalyticsActions.ts-278-
src/lib/actions/performanceAnalyticsActions.ts-279-// Get top performers
src/lib/actions/performanceAnalyticsActions.ts:280:export async function getTopPerformers(limit: number = 10, classId?: string) {
src/lib/actions/performanceAnalyticsActions.ts-281-  try {
src/lib/actions/performanceAnalyticsActions.ts-282-    // CRITICAL: Add school isolation
src/lib/actions/performanceAnalyticsActions.ts-283-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/performanceAnalyticsActions.ts-284-    const schoolId = await getRequiredSchoolId();
src/lib/actions/performanceAnalyticsActions.ts-285-
--
src/lib/actions/teacherAttendanceOverviewActions.ts-8- * Get teacher attendance overview data
src/lib/actions/teacherAttendanceOverviewActions.ts-9- */
src/lib/actions/teacherAttendanceOverviewActions.ts:10:export async function getTeacherAttendanceOverview() {
src/lib/actions/teacherAttendanceOverviewActions.ts-11-  try {
src/lib/actions/teacherAttendanceOverviewActions.ts-12-    const session = await auth();
src/lib/actions/teacherAttendanceOverviewActions.ts-13-    const userId = session?.user?.id;
src/lib/actions/teacherAttendanceOverviewActions.ts-14-
src/lib/actions/teacherAttendanceOverviewActions.ts-15-    if (!userId) {
--
src/lib/actions/whatsappActions.ts-52- * @returns Action result with message ID
src/lib/actions/whatsappActions.ts-53- */
src/lib/actions/whatsappActions.ts:54:export async function sendWhatsAppMessage(data: {
src/lib/actions/whatsappActions.ts-55-  to: string;
src/lib/actions/whatsappActions.ts-56-  message: string;
src/lib/actions/whatsappActions.ts-57-  previewUrl?: boolean;
src/lib/actions/whatsappActions.ts-58-}): Promise<ActionResult<{ messageId: string }>> {
src/lib/actions/whatsappActions.ts-59-  try {
--
src/lib/actions/whatsappActions.ts-142- * @returns Action result with message ID
src/lib/actions/whatsappActions.ts-143- */
src/lib/actions/whatsappActions.ts:144:export async function sendWhatsAppTemplate(data: {
src/lib/actions/whatsappActions.ts-145-  to: string;
src/lib/actions/whatsappActions.ts-146-  templateName: string;
src/lib/actions/whatsappActions.ts-147-  languageCode?: string;
src/lib/actions/whatsappActions.ts-148-  components?: WhatsAppTemplateComponent[];
src/lib/actions/whatsappActions.ts-149-}): Promise<ActionResult<{ messageId: string }>> {
--
src/lib/actions/whatsappActions.ts-236- * @returns Action result with message ID
src/lib/actions/whatsappActions.ts-237- */
src/lib/actions/whatsappActions.ts:238:export async function sendWhatsAppMedia(data: {
src/lib/actions/whatsappActions.ts-239-  to: string;
src/lib/actions/whatsappActions.ts-240-  mediaType: 'image' | 'document' | 'video' | 'audio';
src/lib/actions/whatsappActions.ts-241-  mediaUrl: string;
src/lib/actions/whatsappActions.ts-242-  caption?: string;
src/lib/actions/whatsappActions.ts-243-  filename?: string;
--
src/lib/actions/whatsappActions.ts-342- * @returns Action result with message ID
src/lib/actions/whatsappActions.ts-343- */
src/lib/actions/whatsappActions.ts:344:export async function sendWhatsAppInteractive(data: {
src/lib/actions/whatsappActions.ts-345-  to: string;
src/lib/actions/whatsappActions.ts-346-  interactive: WhatsAppInteractiveMessage['interactive'];
src/lib/actions/whatsappActions.ts-347-}): Promise<ActionResult<{ messageId: string }>> {
src/lib/actions/whatsappActions.ts-348-  try {
src/lib/actions/whatsappActions.ts-349-    // Check authentication
--
src/lib/actions/whatsappActions.ts-447- * @returns Action result with delivery summary
src/lib/actions/whatsappActions.ts-448- */
src/lib/actions/whatsappActions.ts:449:export async function sendBulkWhatsApp(data: {
src/lib/actions/whatsappActions.ts-450-  recipients: string[];
src/lib/actions/whatsappActions.ts-451-  message: string;
src/lib/actions/whatsappActions.ts-452-  previewUrl?: boolean;
src/lib/actions/whatsappActions.ts-453-}): Promise<ActionResult<{
src/lib/actions/whatsappActions.ts-454-  total: number;
--
src/lib/actions/whatsappActions.ts-589- * @returns Action result with delivery status
src/lib/actions/whatsappActions.ts-590- */
src/lib/actions/whatsappActions.ts:591:export async function getWhatsAppStatus(
src/lib/actions/whatsappActions.ts-592-  messageId: string
src/lib/actions/whatsappActions.ts-593-): Promise<ActionResult<{
src/lib/actions/whatsappActions.ts-594-  status: string;
src/lib/actions/whatsappActions.ts-595-  timestamp?: Date;
src/lib/actions/whatsappActions.ts-596-  error?: string;
--
src/lib/actions/whatsappActions.ts-647- * @returns Action result with configuration status
src/lib/actions/whatsappActions.ts-648- */
src/lib/actions/whatsappActions.ts:649:export async function checkWhatsAppConfigurationAction(): Promise<ActionResult<{
src/lib/actions/whatsappActions.ts-650-  configured: boolean;
src/lib/actions/whatsappActions.ts-651-  accessToken: boolean;
src/lib/actions/whatsappActions.ts-652-  phoneNumberId: boolean;
src/lib/actions/whatsappActions.ts-653-  businessAccountId: boolean;
src/lib/actions/whatsappActions.ts-654-  appSecret: boolean;
--
src/lib/actions/whatsappActions.ts-706- * @returns Action result with business profile data
src/lib/actions/whatsappActions.ts-707- */
src/lib/actions/whatsappActions.ts:708:export async function getWhatsAppBusinessProfile(): Promise<ActionResult<{
src/lib/actions/whatsappActions.ts-709-  about?: string;
src/lib/actions/whatsappActions.ts-710-  address?: string;
src/lib/actions/whatsappActions.ts-711-  description?: string;
src/lib/actions/whatsappActions.ts-712-  email?: string;
src/lib/actions/whatsappActions.ts-713-  profile_picture_url?: string;
--
src/lib/actions/whatsappActions.ts-765- * @returns Action result
src/lib/actions/whatsappActions.ts-766- */
src/lib/actions/whatsappActions.ts:767:export async function updateWhatsAppBusinessProfile(data: {
src/lib/actions/whatsappActions.ts-768-  about?: string;
src/lib/actions/whatsappActions.ts-769-  address?: string;
src/lib/actions/whatsappActions.ts-770-  description?: string;
src/lib/actions/whatsappActions.ts-771-  email?: string;
src/lib/actions/whatsappActions.ts-772-  websites?: string[];
--
src/lib/actions/whatsappActions.ts-842- * @returns Action result
src/lib/actions/whatsappActions.ts-843- */
src/lib/actions/whatsappActions.ts:844:export async function uploadWhatsAppProfilePhoto(
src/lib/actions/whatsappActions.ts-845-  formData: FormData
src/lib/actions/whatsappActions.ts-846-): Promise<ActionResult> {
src/lib/actions/whatsappActions.ts-847-  try {
src/lib/actions/whatsappActions.ts-848-    // Check authentication
src/lib/actions/whatsappActions.ts-849-    const session = await auth();
--
src/lib/actions/mind-map-actions.ts-38- * Get all mind maps for a student
src/lib/actions/mind-map-actions.ts-39- */
src/lib/actions/mind-map-actions.ts:40:export async function getMindMaps(studentId?: string) {
src/lib/actions/mind-map-actions.ts-41-  try {
src/lib/actions/mind-map-actions.ts-42-    const session = await auth();
src/lib/actions/mind-map-actions.ts-43-    if (!session?.user?.id) {
src/lib/actions/mind-map-actions.ts-44-      throw new Error("Not authenticated");
src/lib/actions/mind-map-actions.ts-45-    }
--
src/lib/actions/mind-map-actions.ts-89- * Get a specific mind map
src/lib/actions/mind-map-actions.ts-90- */
src/lib/actions/mind-map-actions.ts:91:export async function getMindMap(mindMapId: string) {
src/lib/actions/mind-map-actions.ts-92-  try {
src/lib/actions/mind-map-actions.ts-93-    const session = await auth();
src/lib/actions/mind-map-actions.ts-94-    if (!session?.user?.id) {
src/lib/actions/mind-map-actions.ts-95-      throw new Error("Not authenticated");
src/lib/actions/mind-map-actions.ts-96-    }
--
src/lib/actions/mind-map-actions.ts-128- * Create a new mind map
src/lib/actions/mind-map-actions.ts-129- */
src/lib/actions/mind-map-actions.ts:130:export async function createMindMap(data: {
src/lib/actions/mind-map-actions.ts-131-  title: string;
src/lib/actions/mind-map-actions.ts-132-  subject: string;
src/lib/actions/mind-map-actions.ts-133-  nodes?: MindMapNode[];
src/lib/actions/mind-map-actions.ts-134-  connections?: MindMapConnection[];
src/lib/actions/mind-map-actions.ts-135-  isPublic?: boolean;
--
src/lib/actions/mind-map-actions.ts-189- * Update a mind map
src/lib/actions/mind-map-actions.ts-190- */
src/lib/actions/mind-map-actions.ts:191:export async function updateMindMap(
src/lib/actions/mind-map-actions.ts-192-  mindMapId: string,
src/lib/actions/mind-map-actions.ts-193-  data: {
src/lib/actions/mind-map-actions.ts-194-    title?: string;
src/lib/actions/mind-map-actions.ts-195-    subject?: string;
src/lib/actions/mind-map-actions.ts-196-    nodes?: MindMapNode[];
--
src/lib/actions/mind-map-actions.ts-250- * Delete a mind map
src/lib/actions/mind-map-actions.ts-251- */
src/lib/actions/mind-map-actions.ts:252:export async function deleteMindMap(mindMapId: string) {
src/lib/actions/mind-map-actions.ts-253-  try {
src/lib/actions/mind-map-actions.ts-254-    const session = await auth();
src/lib/actions/mind-map-actions.ts-255-    if (!session?.user?.id) {
src/lib/actions/mind-map-actions.ts-256-      throw new Error("Not authenticated");
src/lib/actions/mind-map-actions.ts-257-    }
--
src/lib/actions/mind-map-actions.ts-295- * Add a node to a mind map
src/lib/actions/mind-map-actions.ts-296- */
src/lib/actions/mind-map-actions.ts:297:export async function addMindMapNode(
src/lib/actions/mind-map-actions.ts-298-  mindMapId: string,
src/lib/actions/mind-map-actions.ts-299-  node: MindMapNode
src/lib/actions/mind-map-actions.ts-300-) {
src/lib/actions/mind-map-actions.ts-301-  try {
src/lib/actions/mind-map-actions.ts-302-    const session = await auth();
--
src/lib/actions/mind-map-actions.ts-349- * Update a node in a mind map
src/lib/actions/mind-map-actions.ts-350- */
src/lib/actions/mind-map-actions.ts:351:export async function updateMindMapNode(
src/lib/actions/mind-map-actions.ts-352-  mindMapId: string,
src/lib/actions/mind-map-actions.ts-353-  nodeId: string,
src/lib/actions/mind-map-actions.ts-354-  updates: Partial<MindMapNode>
src/lib/actions/mind-map-actions.ts-355-) {
src/lib/actions/mind-map-actions.ts-356-  try {
--
src/lib/actions/mind-map-actions.ts-406- * Remove a node from a mind map
src/lib/actions/mind-map-actions.ts-407- */
src/lib/actions/mind-map-actions.ts:408:export async function removeMindMapNode(
src/lib/actions/mind-map-actions.ts-409-  mindMapId: string,
src/lib/actions/mind-map-actions.ts-410-  nodeId: string
src/lib/actions/mind-map-actions.ts-411-) {
src/lib/actions/mind-map-actions.ts-412-  try {
src/lib/actions/mind-map-actions.ts-413-    const session = await auth();
--
src/lib/actions/mind-map-actions.ts-467- * Add a connection between nodes
src/lib/actions/mind-map-actions.ts-468- */
src/lib/actions/mind-map-actions.ts:469:export async function addMindMapConnection(
src/lib/actions/mind-map-actions.ts-470-  mindMapId: string,
src/lib/actions/mind-map-actions.ts-471-  connection: MindMapConnection
src/lib/actions/mind-map-actions.ts-472-) {
src/lib/actions/mind-map-actions.ts-473-  try {
src/lib/actions/mind-map-actions.ts-474-    const session = await auth();
--
src/lib/actions/mind-map-actions.ts-521- * Remove a connection between nodes
src/lib/actions/mind-map-actions.ts-522- */
src/lib/actions/mind-map-actions.ts:523:export async function removeMindMapConnection(
src/lib/actions/mind-map-actions.ts-524-  mindMapId: string,
src/lib/actions/mind-map-actions.ts-525-  connectionId: string
src/lib/actions/mind-map-actions.ts-526-) {
src/lib/actions/mind-map-actions.ts-527-  try {
src/lib/actions/mind-map-actions.ts-528-    const session = await auth();
--
src/lib/actions/leaveApplicationsActions.ts-808-
src/lib/actions/leaveApplicationsActions.ts-809-// Get leave applications for a specific student or teacher
src/lib/actions/leaveApplicationsActions.ts:810:export async function getLeaveApplicationsForEntity(entityId: string, entityType: string) {
src/lib/actions/leaveApplicationsActions.ts-811-  try {
src/lib/actions/leaveApplicationsActions.ts-812-    const user = await currentUser();
src/lib/actions/leaveApplicationsActions.ts-813-    if (!user) {
src/lib/actions/leaveApplicationsActions.ts-814-      return { success: false, error: "Unauthorized" };
src/lib/actions/leaveApplicationsActions.ts-815-    }
--
src/lib/actions/subjectTeacherActions.ts-6-
src/lib/actions/subjectTeacherActions.ts-7-// Get a subject by ID with assigned teachers
src/lib/actions/subjectTeacherActions.ts:8:export async function getSubjectById(id: string) {
src/lib/actions/subjectTeacherActions.ts-9-  try {
src/lib/actions/subjectTeacherActions.ts-10-    const subject = await db.subject.findUnique({
src/lib/actions/subjectTeacherActions.ts-11-      where: { id },
src/lib/actions/subjectTeacherActions.ts-12-      include: {
src/lib/actions/subjectTeacherActions.ts-13-        department: {
--
src/lib/actions/subjectTeacherActions.ts-71-
src/lib/actions/subjectTeacherActions.ts-72-// Get teachers that can be assigned to this subject
src/lib/actions/subjectTeacherActions.ts:73:export async function getTeachersForAssignment(subjectId: string) {
src/lib/actions/subjectTeacherActions.ts-74-  try {
src/lib/actions/subjectTeacherActions.ts-75-    // First, get currently assigned teacher IDs
src/lib/actions/subjectTeacherActions.ts-76-    const subject = await db.subject.findUnique({
src/lib/actions/subjectTeacherActions.ts-77-      where: { id: subjectId },
src/lib/actions/subjectTeacherActions.ts-78-      include: {
--
src/lib/actions/subjectTeacherActions.ts-143-
src/lib/actions/subjectTeacherActions.ts-144-// Assign a teacher to a subject
src/lib/actions/subjectTeacherActions.ts:145:export async function assignTeacherToSubject(subjectId: string, teacherId: string) {
src/lib/actions/subjectTeacherActions.ts-146-  try {
src/lib/actions/subjectTeacherActions.ts-147-    // Check if the assignment already exists
src/lib/actions/subjectTeacherActions.ts-148-    const existingAssignment = await db.subjectTeacher.findFirst({
src/lib/actions/subjectTeacherActions.ts-149-      where: {
src/lib/actions/subjectTeacherActions.ts-150-        subjectId,
--
src/lib/actions/subjectTeacherActions.ts-191-
src/lib/actions/subjectTeacherActions.ts-192-// Remove a teacher from a subject
src/lib/actions/subjectTeacherActions.ts:193:export async function removeTeacherFromSubject(subjectId: string, teacherId: string) {
src/lib/actions/subjectTeacherActions.ts-194-  try {
src/lib/actions/subjectTeacherActions.ts-195-    // Check if the assignment exists
src/lib/actions/subjectTeacherActions.ts-196-    const existingAssignment = await db.subjectTeacher.findFirst({
src/lib/actions/subjectTeacherActions.ts-197-      where: {
src/lib/actions/subjectTeacherActions.ts-198-        subjectId,
--
src/lib/actions/subjectTeacherActions.ts-240-
src/lib/actions/subjectTeacherActions.ts-241-// Remove a teacher from a subject by assignment ID
src/lib/actions/subjectTeacherActions.ts:242:export async function deleteSubjectTeacherAssignment(assignmentId: string) {
src/lib/actions/subjectTeacherActions.ts-243-  try {
src/lib/actions/subjectTeacherActions.ts-244-    // Get the assignment to check if it exists and get IDs for revalidation
src/lib/actions/subjectTeacherActions.ts-245-    const assignment = await db.subjectTeacher.findUnique({
src/lib/actions/subjectTeacherActions.ts-246-      where: { id: assignmentId },
src/lib/actions/subjectTeacherActions.ts-247-      select: { 
--
src/lib/actions/curriculumActions.ts-5-import { revalidatePath } from "next/cache";
src/lib/actions/curriculumActions.ts-6-
src/lib/actions/curriculumActions.ts:7:export async function getClassSubjects(classId: string) {
src/lib/actions/curriculumActions.ts-8-    try {
src/lib/actions/curriculumActions.ts-9-        const session = await auth();
src/lib/actions/curriculumActions.ts-10-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-11-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-12-        }
--
src/lib/actions/curriculumActions.ts-35-}
src/lib/actions/curriculumActions.ts-36-
src/lib/actions/curriculumActions.ts:37:export async function getSectionSubjects(sectionId: string) {
src/lib/actions/curriculumActions.ts-38-    try {
src/lib/actions/curriculumActions.ts-39-        const session = await auth();
src/lib/actions/curriculumActions.ts-40-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-41-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-42-        }
--
src/lib/actions/curriculumActions.ts-80-}
src/lib/actions/curriculumActions.ts-81-
src/lib/actions/curriculumActions.ts:82:export async function assignSubjectToClass(classId: string, subjectId: string) {
src/lib/actions/curriculumActions.ts-83-    try {
src/lib/actions/curriculumActions.ts-84-        const session = await auth();
src/lib/actions/curriculumActions.ts-85-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-86-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-87-        }
--
src/lib/actions/curriculumActions.ts-131-}
src/lib/actions/curriculumActions.ts-132-
src/lib/actions/curriculumActions.ts:133:export async function assignSubjectToSection(classId: string, sectionId: string, subjectId: string) {
src/lib/actions/curriculumActions.ts-134-    try {
src/lib/actions/curriculumActions.ts-135-        const session = await auth();
src/lib/actions/curriculumActions.ts-136-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-137-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-138-        }
--
src/lib/actions/curriculumActions.ts-169-}
src/lib/actions/curriculumActions.ts-170-
src/lib/actions/curriculumActions.ts:171:export async function removeSubjectAssignment(id: string) {
src/lib/actions/curriculumActions.ts-172-    try {
src/lib/actions/curriculumActions.ts-173-        const session = await auth();
src/lib/actions/curriculumActions.ts-174-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-175-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-176-        }
--
src/lib/actions/curriculumActions.ts-194-}
src/lib/actions/curriculumActions.ts-195-
src/lib/actions/curriculumActions.ts:196:export async function getClassesWithSections() {
src/lib/actions/curriculumActions.ts-197-    try {
src/lib/actions/curriculumActions.ts-198-        const session = await auth();
src/lib/actions/curriculumActions.ts-199-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-200-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-201-        }
--
src/lib/actions/curriculumActions.ts-227-}
src/lib/actions/curriculumActions.ts-228-
src/lib/actions/curriculumActions.ts:229:export async function getAllSubjects() {
src/lib/actions/curriculumActions.ts-230-    try {
src/lib/actions/curriculumActions.ts-231-        const session = await auth();
src/lib/actions/curriculumActions.ts-232-        if (!session?.user?.id || !session.user.schoolId) {
src/lib/actions/curriculumActions.ts-233-            return { success: false, error: "Unauthorized" };
src/lib/actions/curriculumActions.ts-234-        }
--
src/lib/actions/parent-student-actions.ts-12-});
src/lib/actions/parent-student-actions.ts-13-
src/lib/actions/parent-student-actions.ts:14:export async function associateStudentWithParent(formData: FormData, schoolId: string) {
src/lib/actions/parent-student-actions.ts-15-  const parentId = formData.get('parentId') as string;
src/lib/actions/parent-student-actions.ts-16-  const studentId = formData.get('studentId') as string;
src/lib/actions/parent-student-actions.ts-17-  const isPrimary = formData.get('isPrimary') === 'true';
src/lib/actions/parent-student-actions.ts-18-  
src/lib/actions/parent-student-actions.ts-19-  try {
--
src/lib/actions/parent-student-actions.ts-92-}
src/lib/actions/parent-student-actions.ts-93-
src/lib/actions/parent-student-actions.ts:94:export async function removeStudentFromParent(formData: FormData) {
src/lib/actions/parent-student-actions.ts-95-  const parentId = formData.get('parentId') as string;
src/lib/actions/parent-student-actions.ts-96-  const studentId = formData.get('studentId') as string;
src/lib/actions/parent-student-actions.ts-97-  
src/lib/actions/parent-student-actions.ts-98-  try {
src/lib/actions/parent-student-actions.ts-99-    // Find the association
--
src/lib/actions/teacherDashboardActions.ts-8- * Get total number of students taught by a teacher
src/lib/actions/teacherDashboardActions.ts-9- */
src/lib/actions/teacherDashboardActions.ts:10:export async function getTotalStudents(teacherId: string) {
src/lib/actions/teacherDashboardActions.ts-11-  try {
src/lib/actions/teacherDashboardActions.ts-12-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-13-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-14-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-15-
--
src/lib/actions/teacherDashboardActions.ts-45- * Get pending assignments that need grading
src/lib/actions/teacherDashboardActions.ts-46- */
src/lib/actions/teacherDashboardActions.ts:47:export async function getPendingAssignments(teacherId: string) {
src/lib/actions/teacherDashboardActions.ts-48-  try {
src/lib/actions/teacherDashboardActions.ts-49-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-50-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-51-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-52-
--
src/lib/actions/teacherDashboardActions.ts-120- * Get upcoming exams within the next 7 days
src/lib/actions/teacherDashboardActions.ts-121- */
src/lib/actions/teacherDashboardActions.ts:122:export async function getUpcomingExams(teacherId: string) {
src/lib/actions/teacherDashboardActions.ts-123-  try {
src/lib/actions/teacherDashboardActions.ts-124-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-125-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-126-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-127-
--
src/lib/actions/teacherDashboardActions.ts-169- * Get today's classes from timetable
src/lib/actions/teacherDashboardActions.ts-170- */
src/lib/actions/teacherDashboardActions.ts:171:export async function getTodaysClasses(teacherId: string) {
src/lib/actions/teacherDashboardActions.ts-172-  try {
src/lib/actions/teacherDashboardActions.ts-173-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-174-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-175-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-176-
--
src/lib/actions/teacherDashboardActions.ts-246- * Get recent announcements
src/lib/actions/teacherDashboardActions.ts-247- */
src/lib/actions/teacherDashboardActions.ts:248:export async function getRecentAnnouncements() {
src/lib/actions/teacherDashboardActions.ts-249-  try {
src/lib/actions/teacherDashboardActions.ts-250-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-251-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-252-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-253-
--
src/lib/actions/teacherDashboardActions.ts-304- * Get unread messages count for a teacher
src/lib/actions/teacherDashboardActions.ts-305- */
src/lib/actions/teacherDashboardActions.ts:306:export async function getUnreadMessagesCount(teacherId: string) {
src/lib/actions/teacherDashboardActions.ts-307-  try {
src/lib/actions/teacherDashboardActions.ts-308-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-309-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-310-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-311-
--
src/lib/actions/teacherDashboardActions.ts-351- * Get teacher dashboard data
src/lib/actions/teacherDashboardActions.ts-352- */
src/lib/actions/teacherDashboardActions.ts:353:export async function getTeacherDashboardData() {
src/lib/actions/teacherDashboardActions.ts-354-  try {
src/lib/actions/teacherDashboardActions.ts-355-    // CRITICAL: Add school isolation
src/lib/actions/teacherDashboardActions.ts-356-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherDashboardActions.ts-357-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherDashboardActions.ts-358-
--
src/lib/actions/alumniActions.ts-168- * @returns Paginated alumni search results
src/lib/actions/alumniActions.ts-169- */
src/lib/actions/alumniActions.ts:170:export async function searchAlumni(
src/lib/actions/alumniActions.ts-171-  input: AlumniSearchInput
src/lib/actions/alumniActions.ts-172-): Promise<AlumniSearchResult> {
src/lib/actions/alumniActions.ts-173-  try {
src/lib/actions/alumniActions.ts-174-    // Authentication and authorization check (allow ADMIN and TEACHER)
src/lib/actions/alumniActions.ts-175-    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
--
src/lib/actions/alumniActions.ts-346- * @returns Complete alumni profile
src/lib/actions/alumniActions.ts-347- */
src/lib/actions/alumniActions.ts:348:export async function getAlumniProfile(
src/lib/actions/alumniActions.ts-349-  input: GetAlumniProfileInput
src/lib/actions/alumniActions.ts-350-): Promise<AlumniProfileResult> {
src/lib/actions/alumniActions.ts-351-  try {
src/lib/actions/alumniActions.ts-352-    // Authentication and authorization check (allow ADMIN and TEACHER)
src/lib/actions/alumniActions.ts-353-    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
--
src/lib/actions/alumniActions.ts-486- * @returns Updated alumni profile
src/lib/actions/alumniActions.ts-487- */
src/lib/actions/alumniActions.ts:488:export async function updateAlumniProfile(
src/lib/actions/alumniActions.ts-489-  input: UpdateAlumniProfileInput
src/lib/actions/alumniActions.ts-490-): Promise<AlumniProfileResult> {
src/lib/actions/alumniActions.ts-491-  try {
src/lib/actions/alumniActions.ts-492-    // Authentication and authorization check (ADMIN only for updates)
src/lib/actions/alumniActions.ts-493-    const authCheck = await checkAuth([UserRole.ADMIN]);
--
src/lib/actions/alumniActions.ts-602- * @returns Alumni statistics
src/lib/actions/alumniActions.ts-603- */
src/lib/actions/alumniActions.ts:604:export async function getAlumniStatistics(): Promise<AlumniStatisticsResult> {
src/lib/actions/alumniActions.ts-605-  try {
src/lib/actions/alumniActions.ts-606-    // Authentication and authorization check
src/lib/actions/alumniActions.ts-607-    const authCheck = await checkAuth([UserRole.ADMIN, UserRole.TEACHER]);
src/lib/actions/alumniActions.ts-608-    if (!authCheck.authorized) {
src/lib/actions/alumniActions.ts-609-      return { success: false, error: authCheck.error || "Unauthorized" };
--
src/lib/actions/alumniActions.ts-637- * @returns Report data formatted for export
src/lib/actions/alumniActions.ts-638- */
src/lib/actions/alumniActions.ts:639:export async function generateAlumniReport(
src/lib/actions/alumniActions.ts-640-  input: GenerateAlumniReportInput
src/lib/actions/alumniActions.ts-641-) {
src/lib/actions/alumniActions.ts-642-  try {
src/lib/actions/alumniActions.ts-643-    // Authentication and authorization check
src/lib/actions/alumniActions.ts-644-    const authCheck = await checkAuth([UserRole.ADMIN]);
--
src/lib/actions/alumniActions.ts-729- * @returns Export data for client-side generation
src/lib/actions/alumniActions.ts-730- */
src/lib/actions/alumniActions.ts:731:export async function exportAlumniDirectory(
src/lib/actions/alumniActions.ts-732-  filters: AlumniSearchInput,
src/lib/actions/alumniActions.ts-733-  format: "pdf" | "excel" = "excel"
src/lib/actions/alumniActions.ts-734-) {
src/lib/actions/alumniActions.ts-735-  try {
src/lib/actions/alumniActions.ts-736-    // Authentication and authorization check
--
src/lib/actions/alumniActions.ts-914- * @returns Communication result
src/lib/actions/alumniActions.ts-915- */
src/lib/actions/alumniActions.ts:916:export async function sendAlumniMessage(
src/lib/actions/alumniActions.ts-917-  input: SendAlumniMessageInput
src/lib/actions/alumniActions.ts-918-): Promise<AlumniCommunicationResult> {
src/lib/actions/alumniActions.ts-919-  try {
src/lib/actions/alumniActions.ts-920-    // Authentication and authorization check
src/lib/actions/alumniActions.ts-921-    const authCheck = await checkAuth([UserRole.ADMIN]);
--
src/lib/actions/alumniActions.ts-1079- * @returns List of alumni eligible for communication
src/lib/actions/alumniActions.ts-1080- */
src/lib/actions/alumniActions.ts:1081:export async function getAlumniForCommunication(
src/lib/actions/alumniActions.ts-1082-  input: GetAlumniForCommunicationInput
src/lib/actions/alumniActions.ts-1083-) {
src/lib/actions/alumniActions.ts-1084-  try {
src/lib/actions/alumniActions.ts-1085-    // Authentication and authorization check
src/lib/actions/alumniActions.ts-1086-    const authCheck = await checkAuth([UserRole.ADMIN]);
--
src/lib/actions/students-filters.ts-14-}
src/lib/actions/students-filters.ts-15-
src/lib/actions/students-filters.ts:16:export async function getFilteredStudents(filters: StudentFilters) {
src/lib/actions/students-filters.ts-17-  try {
src/lib/actions/students-filters.ts-18-    // Add school isolation
src/lib/actions/students-filters.ts-19-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/students-filters.ts-20-    const schoolId = await getRequiredSchoolId();
src/lib/actions/students-filters.ts-21-
--
src/lib/actions/students-filters.ts-122-}
src/lib/actions/students-filters.ts-123-
src/lib/actions/students-filters.ts:124:export async function getFilterOptions() {
src/lib/actions/students-filters.ts-125-  try {
src/lib/actions/students-filters.ts-126-    // Add school isolation
src/lib/actions/students-filters.ts-127-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/students-filters.ts-128-    const schoolId = await getRequiredSchoolId();
src/lib/actions/students-filters.ts-129-
--
src/lib/actions/reportCardsActions.ts-17-
src/lib/actions/reportCardsActions.ts-18-// Get all report cards with optional filtering
src/lib/actions/reportCardsActions.ts:19:export async function getReportCards(filters?: {
src/lib/actions/reportCardsActions.ts-20-  published?: boolean,
src/lib/actions/reportCardsActions.ts-21-  termId?: string,
src/lib/actions/reportCardsActions.ts-22-  classId?: string
src/lib/actions/reportCardsActions.ts-23-}) {
src/lib/actions/reportCardsActions.ts-24-  try {
--
src/lib/actions/reportCardsActions.ts-115-
src/lib/actions/reportCardsActions.ts-116-// Get a single report card by ID
src/lib/actions/reportCardsActions.ts:117:export async function getReportCardById(id: string) {
src/lib/actions/reportCardsActions.ts-118-  try {
src/lib/actions/reportCardsActions.ts-119-    // First fetch the basic report card to get the studentId
src/lib/actions/reportCardsActions.ts-120-    const basicReportCard = await db.reportCard.findUnique({
src/lib/actions/reportCardsActions.ts-121-      where: { id },
src/lib/actions/reportCardsActions.ts-122-      select: {
--
src/lib/actions/reportCardsActions.ts-261-
src/lib/actions/reportCardsActions.ts-262-// Create a new report card (usually generated from exam results)
src/lib/actions/reportCardsActions.ts:263:export async function createReportCard(data: ReportCardCreateValues) {
src/lib/actions/reportCardsActions.ts-264-  try {
src/lib/actions/reportCardsActions.ts-265-    // Check if a report card already exists for this student and term
src/lib/actions/reportCardsActions.ts-266-    const existingReportCard = await db.reportCard.findUnique({
src/lib/actions/reportCardsActions.ts-267-      where: {
src/lib/actions/reportCardsActions.ts-268-        studentId_termId: {
--
src/lib/actions/reportCardsActions.ts-311-
src/lib/actions/reportCardsActions.ts-312-// Generate report card for a student
src/lib/actions/reportCardsActions.ts:313:export async function generateReportCard(studentId: string, termId: string) {
src/lib/actions/reportCardsActions.ts-314-  try {
src/lib/actions/reportCardsActions.ts-315-    // Import the aggregation service
src/lib/actions/reportCardsActions.ts-316-    const { aggregateReportCardData } = await import("@/lib/services/report-card-data-aggregation");
src/lib/actions/reportCardsActions.ts-317-    
src/lib/actions/reportCardsActions.ts-318-    // Get required school context
--
src/lib/actions/reportCardsActions.ts-393-
src/lib/actions/reportCardsActions.ts-394-// Update report card remarks
src/lib/actions/reportCardsActions.ts:395:export async function updateReportCardRemarks(data: ReportCardRemarksValues) {
src/lib/actions/reportCardsActions.ts-396-  try {
src/lib/actions/reportCardsActions.ts-397-    const reportCard = await db.reportCard.update({
src/lib/actions/reportCardsActions.ts-398-      where: { id: data.id },
src/lib/actions/reportCardsActions.ts-399-      data: {
src/lib/actions/reportCardsActions.ts-400-        teacherRemarks: data.teacherRemarks,
--
src/lib/actions/reportCardsActions.ts-416-
src/lib/actions/reportCardsActions.ts-417-// Publish a report card
src/lib/actions/reportCardsActions.ts:418:export async function publishReportCard(data: ReportCardPublishValues) {
src/lib/actions/reportCardsActions.ts-419-  try {
src/lib/actions/reportCardsActions.ts-420-    // Get report card with student and parent information
src/lib/actions/reportCardsActions.ts-421-    const reportCard = await db.reportCard.findUnique({
src/lib/actions/reportCardsActions.ts-422-      where: { id: data.id },
src/lib/actions/reportCardsActions.ts-423-      include: {
--
src/lib/actions/reportCardsActions.ts-577-
src/lib/actions/reportCardsActions.ts-578-// Batch publish report cards
src/lib/actions/reportCardsActions.ts:579:export async function batchPublishReportCards(reportCardIds: string[], sendNotification = false) {
src/lib/actions/reportCardsActions.ts-580-  try {
src/lib/actions/reportCardsActions.ts-581-    const results = {
src/lib/actions/reportCardsActions.ts-582-      successful: [] as string[],
src/lib/actions/reportCardsActions.ts-583-      failed: [] as { id: string; error: string }[],
src/lib/actions/reportCardsActions.ts-584-    };
--
src/lib/actions/reportCardsActions.ts-613-
src/lib/actions/reportCardsActions.ts-614-// Calculate class ranks for a particular term
src/lib/actions/reportCardsActions.ts:615:export async function calculateClassRanks(termId: string, classId: string) {
src/lib/actions/reportCardsActions.ts-616-  try {
src/lib/actions/reportCardsActions.ts-617-    // Get all report cards for this term and class
src/lib/actions/reportCardsActions.ts-618-    const reportCards = await db.reportCard.findMany({
src/lib/actions/reportCardsActions.ts-619-      where: {
src/lib/actions/reportCardsActions.ts-620-        termId,
--
src/lib/actions/reportCardsActions.ts-653-
src/lib/actions/reportCardsActions.ts-654-// Get terms and classes for filters
src/lib/actions/reportCardsActions.ts:655:export async function getReportCardFilters() {
src/lib/actions/reportCardsActions.ts-656-  try {
src/lib/actions/reportCardsActions.ts-657-    const [terms, classes, sections] = await Promise.all([
src/lib/actions/reportCardsActions.ts-658-      db.term.findMany({
src/lib/actions/reportCardsActions.ts-659-        orderBy: { startDate: 'desc' },
src/lib/actions/reportCardsActions.ts-660-        include: { academicYear: true }
--
src/lib/actions/reportCardsActions.ts-688-
src/lib/actions/reportCardsActions.ts-689-// Get students for report card generation
src/lib/actions/reportCardsActions.ts:690:export async function getStudentsForReportCard() {
src/lib/actions/reportCardsActions.ts-691-  try {
src/lib/actions/reportCardsActions.ts-692-    const students = await db.student.findMany({
src/lib/actions/reportCardsActions.ts-693-      select: {
src/lib/actions/reportCardsActions.ts-694-        id: true,
src/lib/actions/reportCardsActions.ts-695-        admissionId: true,
--
src/lib/actions/reportCardsActions.ts-742- * This is useful for displaying attendance breakdown in report cards
src/lib/actions/reportCardsActions.ts-743- */
src/lib/actions/reportCardsActions.ts:744:export async function getAttendanceForReportCard(studentId: string, termId: string) {
src/lib/actions/reportCardsActions.ts-745-  try {
src/lib/actions/reportCardsActions.ts-746-    const attendanceData = await calculateAttendanceForTerm(studentId, termId);
src/lib/actions/reportCardsActions.ts-747-
src/lib/actions/reportCardsActions.ts-748-    return {
src/lib/actions/reportCardsActions.ts-749-      success: true,
--
src/lib/actions/promotionActions.ts-107- * @returns List of students with active enrollments
src/lib/actions/promotionActions.ts-108- */
src/lib/actions/promotionActions.ts:109:export async function getStudentsForPromotion(
src/lib/actions/promotionActions.ts-110-  input: GetStudentsForPromotionInput
src/lib/actions/promotionActions.ts-111-): Promise<PromotionPreviewResult> {
src/lib/actions/promotionActions.ts-112-  try {
src/lib/actions/promotionActions.ts-113-    // Authentication and authorization check
src/lib/actions/promotionActions.ts-114-    const authCheck = await checkAdminAuth();
--
src/lib/actions/promotionActions.ts-198- * @returns Preview with warnings and validation results
src/lib/actions/promotionActions.ts-199- */
src/lib/actions/promotionActions.ts:200:export async function previewPromotion(
src/lib/actions/promotionActions.ts-201-  input: PromotionPreviewInput
src/lib/actions/promotionActions.ts-202-): Promise<PromotionPreviewResult> {
src/lib/actions/promotionActions.ts-203-  try {
src/lib/actions/promotionActions.ts-204-    // Authentication and authorization check
src/lib/actions/promotionActions.ts-205-    const authCheck = await checkAdminAuth();
--
src/lib/actions/promotionActions.ts-310- * @returns Execution results with success/failure counts
src/lib/actions/promotionActions.ts-311- */
src/lib/actions/promotionActions.ts:312:export async function executeBulkPromotion(
src/lib/actions/promotionActions.ts-313-  input: BulkPromotionInput
src/lib/actions/promotionActions.ts-314-): Promise<PromotionExecutionResult> {
src/lib/actions/promotionActions.ts-315-  try {
src/lib/actions/promotionActions.ts-316-    // Authentication and authorization check
src/lib/actions/promotionActions.ts-317-    const authCheck = await checkAdminAuth();
--
src/lib/actions/promotionActions.ts-595- * @returns Paginated promotion history
src/lib/actions/promotionActions.ts-596- */
src/lib/actions/promotionActions.ts:597:export async function getPromotionHistory(
src/lib/actions/promotionActions.ts-598-  filters?: PromotionHistoryFiltersInput
src/lib/actions/promotionActions.ts-599-) {
src/lib/actions/promotionActions.ts-600-  try {
src/lib/actions/promotionActions.ts-601-    // Authentication and authorization check
src/lib/actions/promotionActions.ts-602-    const authCheck = await checkAdminAuth();
--
src/lib/actions/promotionActions.ts-766- * @returns Detailed promotion information including student list
src/lib/actions/promotionActions.ts-767- */
src/lib/actions/promotionActions.ts:768:export async function getPromotionDetails(
src/lib/actions/promotionActions.ts-769-  input: PromotionDetailsInput
src/lib/actions/promotionActions.ts-770-) {
src/lib/actions/promotionActions.ts-771-  try {
src/lib/actions/promotionActions.ts-772-    // Authentication and authorization check
src/lib/actions/promotionActions.ts-773-    const authCheck = await checkAdminAuth();
--
src/lib/actions/promotionActions.ts-904- * @returns Export data for client-side generation
src/lib/actions/promotionActions.ts-905- */
src/lib/actions/promotionActions.ts:906:export async function exportPromotionHistory(
src/lib/actions/promotionActions.ts-907-  filters?: PromotionHistoryFiltersInput,
src/lib/actions/promotionActions.ts-908-  format: "pdf" | "excel" = "excel"
src/lib/actions/promotionActions.ts-909-) {
src/lib/actions/promotionActions.ts-910-  try {
src/lib/actions/promotionActions.ts-911-    // Authentication and authorization check
--
src/lib/actions/promotionActions.ts-1063- * @returns Rollback result
src/lib/actions/promotionActions.ts-1064- */
src/lib/actions/promotionActions.ts:1065:export async function rollbackPromotion(
src/lib/actions/promotionActions.ts-1066-  input: PromotionRollbackInput
src/lib/actions/promotionActions.ts-1067-) {
src/lib/actions/promotionActions.ts-1068-  try {
src/lib/actions/promotionActions.ts-1069-    // Authentication and authorization check
src/lib/actions/promotionActions.ts-1070-    const authCheck = await checkAdminAuth();
--
src/lib/actions/student-assessment-actions.ts-16-
src/lib/actions/student-assessment-actions.ts-17-// Export a getter function for the schema instead of the schema directly
src/lib/actions/student-assessment-actions.ts:18:export async function getAssignmentSubmissionSchema() {
src/lib/actions/student-assessment-actions.ts-19-  return assignmentSubmissionSchema;
src/lib/actions/student-assessment-actions.ts-20-}
src/lib/actions/student-assessment-actions.ts-21-
src/lib/actions/student-assessment-actions.ts-22-/**
src/lib/actions/student-assessment-actions.ts-23- * Get the current student's details with active enrollment
--
src/lib/actions/student-assessment-actions.ts-68- * Get all upcoming exams for the student
src/lib/actions/student-assessment-actions.ts-69- */
src/lib/actions/student-assessment-actions.ts:70:export async function getUpcomingExams() {
src/lib/actions/student-assessment-actions.ts-71-  const { student, currentEnrollment } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-72-  const currentDate = new Date();
src/lib/actions/student-assessment-actions.ts-73-
src/lib/actions/student-assessment-actions.ts-74-  // Get all subject IDs for the student's class
src/lib/actions/student-assessment-actions.ts-75-  const subjectClasses = await db.subjectClass.findMany({
--
src/lib/actions/student-assessment-actions.ts-127- * Get a specific exam's details
src/lib/actions/student-assessment-actions.ts-128- */
src/lib/actions/student-assessment-actions.ts:129:export async function getExamDetails(examId: string) {
src/lib/actions/student-assessment-actions.ts-130-  const { student } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-131-
src/lib/actions/student-assessment-actions.ts-132-  const exam = await db.exam.findUnique({
src/lib/actions/student-assessment-actions.ts-133-    where: {
src/lib/actions/student-assessment-actions.ts-134-      id: examId,
--
src/lib/actions/student-assessment-actions.ts-178- * Get the student's exam results
src/lib/actions/student-assessment-actions.ts-179- */
src/lib/actions/student-assessment-actions.ts:180:export async function getExamResults() {
src/lib/actions/student-assessment-actions.ts-181-  const { student, currentEnrollment } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-182-
src/lib/actions/student-assessment-actions.ts-183-  // Get all subject IDs for the student's class
src/lib/actions/student-assessment-actions.ts-184-  const subjectClasses = await db.subjectClass.findMany({
src/lib/actions/student-assessment-actions.ts-185-    where: {
--
src/lib/actions/student-assessment-actions.ts-238- * Get all assignments for the student
src/lib/actions/student-assessment-actions.ts-239- */
src/lib/actions/student-assessment-actions.ts:240:export async function getAssignments() {
src/lib/actions/student-assessment-actions.ts-241-  const { student, currentEnrollment } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-242-
src/lib/actions/student-assessment-actions.ts-243-  // Get all subject IDs for the student's class
src/lib/actions/student-assessment-actions.ts-244-  const subjectClasses = await db.subjectClass.findMany({
src/lib/actions/student-assessment-actions.ts-245-    where: {
--
src/lib/actions/student-assessment-actions.ts-332- * Get a specific assignment's details
src/lib/actions/student-assessment-actions.ts-333- */
src/lib/actions/student-assessment-actions.ts:334:export async function getAssignmentDetails(assignmentId: string) {
src/lib/actions/student-assessment-actions.ts-335-  const { student } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-336-
src/lib/actions/student-assessment-actions.ts-337-  const assignment = await db.assignment.findUnique({
src/lib/actions/student-assessment-actions.ts-338-    where: {
src/lib/actions/student-assessment-actions.ts-339-      id: assignmentId,
--
src/lib/actions/student-assessment-actions.ts-389- * Submit an assignment
src/lib/actions/student-assessment-actions.ts-390- */
src/lib/actions/student-assessment-actions.ts:391:export async function submitAssignment(values: z.infer<typeof assignmentSubmissionSchema>) {
src/lib/actions/student-assessment-actions.ts-392-  const { student } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-393-  const { assignmentId, content, attachments } = values;
src/lib/actions/student-assessment-actions.ts-394-
src/lib/actions/student-assessment-actions.ts-395-  // Check if assignment exists and is valid for submission
src/lib/actions/student-assessment-actions.ts-396-  const assignment = await db.assignment.findUnique({
--
src/lib/actions/student-assessment-actions.ts-451- * Get report cards for the student
src/lib/actions/student-assessment-actions.ts-452- */
src/lib/actions/student-assessment-actions.ts:453:export async function getReportCards() {
src/lib/actions/student-assessment-actions.ts-454-  const { student } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-455-
src/lib/actions/student-assessment-actions.ts-456-  const reportCards = await db.reportCard.findMany({
src/lib/actions/student-assessment-actions.ts-457-    where: {
src/lib/actions/student-assessment-actions.ts-458-      studentId: student.id,
--
src/lib/actions/student-assessment-actions.ts-492- * Get a specific report card's details
src/lib/actions/student-assessment-actions.ts-493- */
src/lib/actions/student-assessment-actions.ts:494:export async function getReportCardDetails(reportCardId: string) {
src/lib/actions/student-assessment-actions.ts-495-  const { student } = await getStudentWithEnrollment();
src/lib/actions/student-assessment-actions.ts-496-
src/lib/actions/student-assessment-actions.ts-497-  const reportCard = await db.reportCard.findUnique({
src/lib/actions/student-assessment-actions.ts-498-    where: {
src/lib/actions/student-assessment-actions.ts-499-      id: reportCardId,
--
src/lib/actions/two-factor-nextauth-actions.ts-31- * Returns QR code and secret for authenticator app setup
src/lib/actions/two-factor-nextauth-actions.ts-32- */
src/lib/actions/two-factor-nextauth-actions.ts:33:export async function initiateTwoFactorSetup(
src/lib/actions/two-factor-nextauth-actions.ts-34-  password: string
src/lib/actions/two-factor-nextauth-actions.ts-35-): Promise<TwoFactorSetupResult> {
src/lib/actions/two-factor-nextauth-actions.ts-36-  try {
src/lib/actions/two-factor-nextauth-actions.ts-37-    const session = await auth()
src/lib/actions/two-factor-nextauth-actions.ts-38-
--
src/lib/actions/two-factor-nextauth-actions.ts-94- * Enables 2FA after verifying the setup token
src/lib/actions/two-factor-nextauth-actions.ts-95- */
src/lib/actions/two-factor-nextauth-actions.ts:96:export async function enableTwoFactor(
src/lib/actions/two-factor-nextauth-actions.ts-97-  secret: string,
src/lib/actions/two-factor-nextauth-actions.ts-98-  token: string,
src/lib/actions/two-factor-nextauth-actions.ts-99-  backupCodes: string[]
src/lib/actions/two-factor-nextauth-actions.ts-100-): Promise<TwoFactorVerifyResult> {
src/lib/actions/two-factor-nextauth-actions.ts-101-  try {
--
src/lib/actions/two-factor-nextauth-actions.ts-148- * Requires TOTP code confirmation
src/lib/actions/two-factor-nextauth-actions.ts-149- */
src/lib/actions/two-factor-nextauth-actions.ts:150:export async function disableTwoFactor(token: string): Promise<TwoFactorVerifyResult> {
src/lib/actions/two-factor-nextauth-actions.ts-151-  try {
src/lib/actions/two-factor-nextauth-actions.ts-152-    const session = await auth()
src/lib/actions/two-factor-nextauth-actions.ts-153-
src/lib/actions/two-factor-nextauth-actions.ts-154-    if (!session?.user?.id) {
src/lib/actions/two-factor-nextauth-actions.ts-155-      return { success: false, error: "Unauthorized" }
--
src/lib/actions/two-factor-nextauth-actions.ts-205- * Gets 2FA status for the current user
src/lib/actions/two-factor-nextauth-actions.ts-206- */
src/lib/actions/two-factor-nextauth-actions.ts:207:export async function getTwoFactorStatus(): Promise<{
src/lib/actions/two-factor-nextauth-actions.ts-208-  success: boolean
src/lib/actions/two-factor-nextauth-actions.ts-209-  enabled: boolean
src/lib/actions/two-factor-nextauth-actions.ts-210-  error?: string
src/lib/actions/two-factor-nextauth-actions.ts-211-}> {
src/lib/actions/two-factor-nextauth-actions.ts-212-  try {
--
src/lib/actions/two-factor-nextauth-actions.ts-237- * Requires TOTP code confirmation
src/lib/actions/two-factor-nextauth-actions.ts-238- */
src/lib/actions/two-factor-nextauth-actions.ts:239:export async function regenerateBackupCodes(token: string): Promise<{
src/lib/actions/two-factor-nextauth-actions.ts-240-  success: boolean
src/lib/actions/two-factor-nextauth-actions.ts-241-  backupCodes?: string[]
src/lib/actions/two-factor-nextauth-actions.ts-242-  error?: string
src/lib/actions/two-factor-nextauth-actions.ts-243-}> {
src/lib/actions/two-factor-nextauth-actions.ts-244-  try {
--
src/lib/actions/timetableActions.ts-15-
src/lib/actions/timetableActions.ts-16-// Get all timetables
src/lib/actions/timetableActions.ts:17:export async function getTimetables() {
src/lib/actions/timetableActions.ts-18-  try {
src/lib/actions/timetableActions.ts-19-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-20-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-21-    const timetables = await db.timetable.findMany({
src/lib/actions/timetableActions.ts-22-      where: { schoolId },
--
src/lib/actions/timetableActions.ts-44-
src/lib/actions/timetableActions.ts-45-// Get a specific timetable by ID
src/lib/actions/timetableActions.ts:46:export async function getTimetableById(id: string) {
src/lib/actions/timetableActions.ts-47-  try {
src/lib/actions/timetableActions.ts-48-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-49-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-50-    const timetable = await db.timetable.findUnique({
src/lib/actions/timetableActions.ts-51-      where: { id, schoolId },
--
src/lib/actions/timetableActions.ts-125-
src/lib/actions/timetableActions.ts-126-// Get timetable slots by class ID
src/lib/actions/timetableActions.ts:127:export async function getTimetableSlotsByClass(classId: string, activeTimetableOnly: boolean = true) {
src/lib/actions/timetableActions.ts-128-  try {
src/lib/actions/timetableActions.ts-129-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-130-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-131-    const whereClause: any = {
src/lib/actions/timetableActions.ts-132-      classId,
--
src/lib/actions/timetableActions.ts-213-
src/lib/actions/timetableActions.ts-214-// Get timetable slots by teacher ID
src/lib/actions/timetableActions.ts:215:export async function getTimetableSlotsByTeacher(teacherId: string, activeTimetableOnly: boolean = true) {
src/lib/actions/timetableActions.ts-216-  try {
src/lib/actions/timetableActions.ts-217-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-218-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-219-    const whereClause: any = {
src/lib/actions/timetableActions.ts-220-      subjectTeacher: {
--
src/lib/actions/timetableActions.ts-299-
src/lib/actions/timetableActions.ts-300-// Get timetable slots by room ID
src/lib/actions/timetableActions.ts:301:export async function getTimetableSlotsByRoom(roomId: string, activeTimetableOnly: boolean = true) {
src/lib/actions/timetableActions.ts-302-  try {
src/lib/actions/timetableActions.ts-303-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-304-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-305-    const whereClause: any = {
src/lib/actions/timetableActions.ts-306-      roomId,
--
src/lib/actions/timetableActions.ts-382-
src/lib/actions/timetableActions.ts-383-// Create a new timetable
src/lib/actions/timetableActions.ts:384:export async function createTimetable(data: TimetableFormValues) {
src/lib/actions/timetableActions.ts-385-  try {
src/lib/actions/timetableActions.ts-386-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-387-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-388-    // If this is set as active, deactivate other active timetables
src/lib/actions/timetableActions.ts-389-    if (data.isActive) {
--
src/lib/actions/timetableActions.ts-417-
src/lib/actions/timetableActions.ts-418-// Update an existing timetable
src/lib/actions/timetableActions.ts:419:export async function updateTimetable(data: TimetableUpdateFormValues) {
src/lib/actions/timetableActions.ts-420-  try {
src/lib/actions/timetableActions.ts-421-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-422-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-423-    // Check if timetable exists
src/lib/actions/timetableActions.ts-424-    const existingTimetable = await db.timetable.findUnique({
--
src/lib/actions/timetableActions.ts-466-
src/lib/actions/timetableActions.ts-467-// Delete a timetable
src/lib/actions/timetableActions.ts:468:export async function deleteTimetable(id: string) {
src/lib/actions/timetableActions.ts-469-  try {
src/lib/actions/timetableActions.ts-470-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-471-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-472-    // Check if timetable has any slots
src/lib/actions/timetableActions.ts-473-    const slotsCount = await db.timetableSlot.count({
--
src/lib/actions/timetableActions.ts-498-
src/lib/actions/timetableActions.ts-499-// Create a new timetable slot
src/lib/actions/timetableActions.ts:500:export async function createTimetableSlot(data: TimetableSlotFormValues) {
src/lib/actions/timetableActions.ts-501-  try {
src/lib/actions/timetableActions.ts-502-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-503-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-504-    // Process optional fields 
src/lib/actions/timetableActions.ts-505-    const sectionId = data.sectionId === "none" ? null : data.sectionId;
--
src/lib/actions/timetableActions.ts-578-
src/lib/actions/timetableActions.ts-579-// Update an existing timetable slot
src/lib/actions/timetableActions.ts:580:export async function updateTimetableSlot(data: TimetableSlotUpdateFormValues) {
src/lib/actions/timetableActions.ts-581-  try {
src/lib/actions/timetableActions.ts-582-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-583-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-584-    // Process optional fields 
src/lib/actions/timetableActions.ts-585-    const sectionId = data.sectionId === "none" ? null : data.sectionId;
--
src/lib/actions/timetableActions.ts-669-
src/lib/actions/timetableActions.ts-670-// Delete a timetable slot
src/lib/actions/timetableActions.ts:671:export async function deleteTimetableSlot(id: string) {
src/lib/actions/timetableActions.ts-672-  try {
src/lib/actions/timetableActions.ts-673-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-674-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-675-    // Get timetable ID for revalidation
src/lib/actions/timetableActions.ts-676-    const slot = await db.timetableSlot.findUnique({
--
src/lib/actions/timetableActions.ts-702-
src/lib/actions/timetableActions.ts-703-// Get all classes for dropdown
src/lib/actions/timetableActions.ts:704:export async function getClassesForTimetable() {
src/lib/actions/timetableActions.ts-705-  try {
src/lib/actions/timetableActions.ts-706-    const session = await auth();
src/lib/actions/timetableActions.ts-707-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/timetableActions.ts-708-    const classes = await db.class.findMany({
src/lib/actions/timetableActions.ts-709-      where: {
--
src/lib/actions/timetableActions.ts-732-
src/lib/actions/timetableActions.ts-733-// Get all rooms for dropdown
src/lib/actions/timetableActions.ts:734:export async function getRoomsForTimetable() {
src/lib/actions/timetableActions.ts-735-  try {
src/lib/actions/timetableActions.ts-736-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/timetableActions.ts-737-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/timetableActions.ts-738-    const rooms = await db.classRoom.findMany({
src/lib/actions/timetableActions.ts-739-      where: { schoolId },
--
src/lib/actions/timetableActions.ts-754-
src/lib/actions/timetableActions.ts-755-// Get all subject-teacher combinations for dropdown
src/lib/actions/timetableActions.ts:756:export async function getSubjectTeachersForTimetable() {
src/lib/actions/timetableActions.ts-757-  try {
src/lib/actions/timetableActions.ts-758-    const session = await auth();
src/lib/actions/timetableActions.ts-759-    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
src/lib/actions/timetableActions.ts-760-    const subjectTeachers = await db.subjectTeacher.findMany({
src/lib/actions/timetableActions.ts-761-      include: {
--
src/lib/actions/student-event-actions.ts-63- * Get all events for a student
src/lib/actions/student-event-actions.ts-64- */
src/lib/actions/student-event-actions.ts:65:export async function getStudentEvents() {
src/lib/actions/student-event-actions.ts-66-  const result = await getCurrentStudent();
src/lib/actions/student-event-actions.ts-67-
src/lib/actions/student-event-actions.ts-68-  if (!result) {
src/lib/actions/student-event-actions.ts-69-    redirect("/login");
src/lib/actions/student-event-actions.ts-70-  }
--
src/lib/actions/student-event-actions.ts-124- * Get details of a specific event
src/lib/actions/student-event-actions.ts-125- */
src/lib/actions/student-event-actions.ts:126:export async function getEventDetails(eventId: string) {
src/lib/actions/student-event-actions.ts-127-  const result = await getCurrentStudent();
src/lib/actions/student-event-actions.ts-128-
src/lib/actions/student-event-actions.ts-129-  if (!result) {
src/lib/actions/student-event-actions.ts-130-    redirect("/login");
src/lib/actions/student-event-actions.ts-131-  }
--
src/lib/actions/student-event-actions.ts-166- * Register for an event
src/lib/actions/student-event-actions.ts-167- */
src/lib/actions/student-event-actions.ts:168:export async function registerForEvent(values: EventRegistrationValues) {
src/lib/actions/student-event-actions.ts-169-  const result = await getCurrentStudent();
src/lib/actions/student-event-actions.ts-170-
src/lib/actions/student-event-actions.ts-171-  if (!result) {
src/lib/actions/student-event-actions.ts-172-    return { success: false, message: "Authentication required" };
src/lib/actions/student-event-actions.ts-173-  }
--
src/lib/actions/student-event-actions.ts-264- * Cancel event registration
src/lib/actions/student-event-actions.ts-265- */
src/lib/actions/student-event-actions.ts:266:export async function cancelEventRegistration(eventId: string) {
src/lib/actions/student-event-actions.ts-267-  const result = await getCurrentStudent();
src/lib/actions/student-event-actions.ts-268-
src/lib/actions/student-event-actions.ts-269-  if (!result) {
src/lib/actions/student-event-actions.ts-270-    return { success: false, message: "Authentication required" };
src/lib/actions/student-event-actions.ts-271-  }
--
src/lib/actions/student-event-actions.ts-337- * Submit feedback for an event
src/lib/actions/student-event-actions.ts-338- */
src/lib/actions/student-event-actions.ts:339:export async function submitEventFeedback(values: EventFeedbackValues) {
src/lib/actions/student-event-actions.ts-340-  const result = await getCurrentStudent();
src/lib/actions/student-event-actions.ts-341-
src/lib/actions/student-event-actions.ts-342-  if (!result) {
src/lib/actions/student-event-actions.ts-343-    return { success: false, message: "Authentication required" };
src/lib/actions/student-event-actions.ts-344-  }
--
src/lib/actions/student-event-actions.ts-381- * Get upcoming events for the student dashboard
src/lib/actions/student-event-actions.ts-382- */
src/lib/actions/student-event-actions.ts:383:export async function getUpcomingEventsForDashboard() {
src/lib/actions/student-event-actions.ts-384-  const result = await getCurrentStudent();
src/lib/actions/student-event-actions.ts-385-
src/lib/actions/student-event-actions.ts-386-  if (!result) {
src/lib/actions/student-event-actions.ts-387-    return [];
src/lib/actions/student-event-actions.ts-388-  }
--
src/lib/actions/parents-filters.ts-10-}
src/lib/actions/parents-filters.ts-11-
src/lib/actions/parents-filters.ts:12:export async function getFilteredParents(filters: ParentFilters) {
src/lib/actions/parents-filters.ts-13-  try {
src/lib/actions/parents-filters.ts-14-    // Add school isolation
src/lib/actions/parents-filters.ts-15-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parents-filters.ts-16-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parents-filters.ts-17-
--
src/lib/actions/parents-filters.ts-103-}
src/lib/actions/parents-filters.ts-104-
src/lib/actions/parents-filters.ts:105:export async function getParentFilterOptions() {
src/lib/actions/parents-filters.ts-106-  try {
src/lib/actions/parents-filters.ts-107-    // Add school isolation
src/lib/actions/parents-filters.ts-108-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/parents-filters.ts-109-    const schoolId = await getRequiredSchoolId();
src/lib/actions/parents-filters.ts-110-
--
src/lib/actions/teachers-filters.ts-12-}
src/lib/actions/teachers-filters.ts-13-
src/lib/actions/teachers-filters.ts:14:export async function getFilteredTeachers(filters: TeacherFilters) {
src/lib/actions/teachers-filters.ts-15-  try {
src/lib/actions/teachers-filters.ts-16-    // Add school isolation
src/lib/actions/teachers-filters.ts-17-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teachers-filters.ts-18-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teachers-filters.ts-19-
--
src/lib/actions/teachers-filters.ts-100-}
src/lib/actions/teachers-filters.ts-101-
src/lib/actions/teachers-filters.ts:102:export async function getTeacherFilterOptions() {
src/lib/actions/teachers-filters.ts-103-  try {
src/lib/actions/teachers-filters.ts-104-    // Add school isolation
src/lib/actions/teachers-filters.ts-105-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teachers-filters.ts-106-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teachers-filters.ts-107-
--
src/lib/actions/student-academics-actions.ts-11- * Get the current student's academic details including enrollment information
src/lib/actions/student-academics-actions.ts-12- */
src/lib/actions/student-academics-actions.ts:13:export async function getStudentAcademicDetails() {
src/lib/actions/student-academics-actions.ts-14-  const session = await auth();
src/lib/actions/student-academics-actions.ts-15-  if (!session?.user?.id) {
src/lib/actions/student-academics-actions.ts-16-    throw new Error("Unauthorized");
src/lib/actions/student-academics-actions.ts-17-  }
src/lib/actions/student-academics-actions.ts-18-
--
src/lib/actions/student-academics-actions.ts-64- * Get all subjects for the student's current class
src/lib/actions/student-academics-actions.ts-65- */
src/lib/actions/student-academics-actions.ts:66:export async function getStudentSubjects() {
src/lib/actions/student-academics-actions.ts-67-  const { student, currentEnrollment } = await getStudentAcademicDetails();
src/lib/actions/student-academics-actions.ts-68-
src/lib/actions/student-academics-actions.ts-69-  const subjects = await db.subjectClass.findMany({
src/lib/actions/student-academics-actions.ts-70-    where: {
src/lib/actions/student-academics-actions.ts-71-      classId: currentEnrollment.classId,
--
src/lib/actions/student-academics-actions.ts-116- * Get detailed information about a specific subject
src/lib/actions/student-academics-actions.ts-117- */
src/lib/actions/student-academics-actions.ts:118:export async function getSubjectDetails(subjectId: string) {
src/lib/actions/student-academics-actions.ts-119-  const { student, currentEnrollment } = await getStudentAcademicDetails();
src/lib/actions/student-academics-actions.ts-120-
src/lib/actions/student-academics-actions.ts-121-  // Verify that this subject belongs to the student's class
src/lib/actions/student-academics-actions.ts-122-  const subjectClass = await db.subjectClass.findFirst({
src/lib/actions/student-academics-actions.ts-123-    where: {
--
src/lib/actions/student-academics-actions.ts-283- * Get the student's schedule/timetable
src/lib/actions/student-academics-actions.ts-284- */
src/lib/actions/student-academics-actions.ts:285:export async function getStudentTimetable() {
src/lib/actions/student-academics-actions.ts-286-  const { student, currentEnrollment } = await getStudentAcademicDetails();
src/lib/actions/student-academics-actions.ts-287-
src/lib/actions/student-academics-actions.ts-288-  // Get the active timetable
src/lib/actions/student-academics-actions.ts-289-  const activeTimetable = await db.timetable.findFirst({
src/lib/actions/student-academics-actions.ts-290-    where: {
--
src/lib/actions/student-academics-actions.ts-367- * Get all lesson materials for a subject
src/lib/actions/student-academics-actions.ts-368- */
src/lib/actions/student-academics-actions.ts:369:export async function getSubjectMaterials(subjectId: string) {
src/lib/actions/student-academics-actions.ts-370-  const { student, currentEnrollment } = await getStudentAcademicDetails();
src/lib/actions/student-academics-actions.ts-371-
src/lib/actions/student-academics-actions.ts-372-  // Verify that this subject belongs to the student's class
src/lib/actions/student-academics-actions.ts-373-  const subjectClass = await db.subjectClass.findFirst({
src/lib/actions/student-academics-actions.ts-374-    where: {
--
src/lib/actions/student-academics-actions.ts-405- * Get the curriculum/syllabus structure for a specific subject
src/lib/actions/student-academics-actions.ts-406- */
src/lib/actions/student-academics-actions.ts:407:export async function getSubjectCurriculum(subjectId: string) {
src/lib/actions/student-academics-actions.ts-408-  const { student, currentEnrollment } = await getStudentAcademicDetails();
src/lib/actions/student-academics-actions.ts-409-
src/lib/actions/student-academics-actions.ts-410-  // Verify that this subject belongs to the student's class
src/lib/actions/student-academics-actions.ts-411-  const subjectClass = await db.subjectClass.findFirst({
src/lib/actions/student-academics-actions.ts-412-    where: {
--
src/lib/actions/permissionActions.ts-61-
src/lib/actions/permissionActions.ts-62-// Get all permissions
src/lib/actions/permissionActions.ts:63:export async function getAllPermissions() {
src/lib/actions/permissionActions.ts-64-  try {
src/lib/actions/permissionActions.ts-65-    const session = await auth();
src/lib/actions/permissionActions.ts-66-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-67-
src/lib/actions/permissionActions.ts-68-    if (!userId) {
--
src/lib/actions/permissionActions.ts-92-
src/lib/actions/permissionActions.ts-93-// Get permissions by category
src/lib/actions/permissionActions.ts:94:export async function getPermissionsByCategory() {
src/lib/actions/permissionActions.ts-95-  try {
src/lib/actions/permissionActions.ts-96-    const session = await auth();
src/lib/actions/permissionActions.ts-97-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-98-
src/lib/actions/permissionActions.ts-99-    if (!userId) {
--
src/lib/actions/permissionActions.ts-136-
src/lib/actions/permissionActions.ts-137-// Get role permissions
src/lib/actions/permissionActions.ts:138:export async function getRolePermissions(role: UserRole) {
src/lib/actions/permissionActions.ts-139-  try {
src/lib/actions/permissionActions.ts-140-    const session = await auth();
src/lib/actions/permissionActions.ts-141-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-142-
src/lib/actions/permissionActions.ts-143-    if (!userId) {
--
src/lib/actions/permissionActions.ts-163-
src/lib/actions/permissionActions.ts-164-// Assign permission to role
src/lib/actions/permissionActions.ts:165:export async function assignPermissionToRole(role: UserRole, permissionId: string) {
src/lib/actions/permissionActions.ts-166-  try {
src/lib/actions/permissionActions.ts-167-    const session = await auth();
src/lib/actions/permissionActions.ts-168-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-169-
src/lib/actions/permissionActions.ts-170-    if (!userId) {
--
src/lib/actions/permissionActions.ts-218-
src/lib/actions/permissionActions.ts-219-// Remove permission from role
src/lib/actions/permissionActions.ts:220:export async function removePermissionFromRole(role: UserRole, permissionId: string) {
src/lib/actions/permissionActions.ts-221-  try {
src/lib/actions/permissionActions.ts-222-    const session = await auth();
src/lib/actions/permissionActions.ts-223-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-224-
src/lib/actions/permissionActions.ts-225-    if (!userId) {
--
src/lib/actions/permissionActions.ts-250-
src/lib/actions/permissionActions.ts-251-// Get user permissions
src/lib/actions/permissionActions.ts:252:export async function getUserPermissions(targetUserId: string) {
src/lib/actions/permissionActions.ts-253-  try {
src/lib/actions/permissionActions.ts-254-    const session = await auth();
src/lib/actions/permissionActions.ts-255-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-256-
src/lib/actions/permissionActions.ts-257-    if (!userId) {
--
src/lib/actions/permissionActions.ts-277-
src/lib/actions/permissionActions.ts-278-// Assign custom permission to user
src/lib/actions/permissionActions.ts:279:export async function assignPermissionToUser(
src/lib/actions/permissionActions.ts-280-  targetUserId: string,
src/lib/actions/permissionActions.ts-281-  permissionId: string,
src/lib/actions/permissionActions.ts-282-  expiresAt?: Date
src/lib/actions/permissionActions.ts-283-) {
src/lib/actions/permissionActions.ts-284-  try {
--
src/lib/actions/permissionActions.ts-343-
src/lib/actions/permissionActions.ts-344-// Remove custom permission from user
src/lib/actions/permissionActions.ts:345:export async function removePermissionFromUser(targetUserId: string, permissionId: string) {
src/lib/actions/permissionActions.ts-346-  try {
src/lib/actions/permissionActions.ts-347-    const session = await auth();
src/lib/actions/permissionActions.ts-348-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-349-
src/lib/actions/permissionActions.ts-350-    if (!userId) {
--
src/lib/actions/permissionActions.ts-375-
src/lib/actions/permissionActions.ts-376-// Get all users with their roles
src/lib/actions/permissionActions.ts:377:export async function getUsersForPermissionManagement() {
src/lib/actions/permissionActions.ts-378-  try {
src/lib/actions/permissionActions.ts-379-    const session = await auth();
src/lib/actions/permissionActions.ts-380-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-381-
src/lib/actions/permissionActions.ts-382-    if (!userId) {
--
src/lib/actions/permissionActions.ts-413-
src/lib/actions/permissionActions.ts-414-// Bulk assign permissions to role
src/lib/actions/permissionActions.ts:415:export async function bulkAssignPermissionsToRole(role: UserRole, permissionIds: string[]) {
src/lib/actions/permissionActions.ts-416-  try {
src/lib/actions/permissionActions.ts-417-    const session = await auth();
src/lib/actions/permissionActions.ts-418-    const userId = session?.user?.id;
src/lib/actions/permissionActions.ts-419-
src/lib/actions/permissionActions.ts-420-    if (!userId) {
--
src/lib/actions/teacher-settings-actions.ts-28- * Get teacher settings
src/lib/actions/teacher-settings-actions.ts-29- */
src/lib/actions/teacher-settings-actions.ts:30:export async function getSettings(teacherId?: string) {
src/lib/actions/teacher-settings-actions.ts-31-  try {
src/lib/actions/teacher-settings-actions.ts-32-    const session = await auth();
src/lib/actions/teacher-settings-actions.ts-33-    const userId = session?.user?.id;
src/lib/actions/teacher-settings-actions.ts-34-
src/lib/actions/teacher-settings-actions.ts-35-    if (!userId) {
--
src/lib/actions/teacher-settings-actions.ts-102- * Update teacher settings
src/lib/actions/teacher-settings-actions.ts-103- */
src/lib/actions/teacher-settings-actions.ts:104:export async function updateSettings(settingsData: {
src/lib/actions/teacher-settings-actions.ts-105-  emailNotifications?: boolean;
src/lib/actions/teacher-settings-actions.ts-106-  smsNotifications?: boolean;
src/lib/actions/teacher-settings-actions.ts-107-  pushNotifications?: boolean;
src/lib/actions/teacher-settings-actions.ts-108-  assignmentReminders?: boolean;
src/lib/actions/teacher-settings-actions.ts-109-  examReminders?: boolean;
--
src/lib/actions/teacher-settings-actions.ts-191- * Update teacher profile
src/lib/actions/teacher-settings-actions.ts-192- */
src/lib/actions/teacher-settings-actions.ts:193:export async function updateProfile(profileData: {
src/lib/actions/teacher-settings-actions.ts-194-  phone?: string;
src/lib/actions/teacher-settings-actions.ts-195-  qualification?: string;
src/lib/actions/teacher-settings-actions.ts-196-}) {
src/lib/actions/teacher-settings-actions.ts-197-  try {
src/lib/actions/teacher-settings-actions.ts-198-    const session = await auth();
--
src/lib/actions/teacher-settings-actions.ts-273- * Change password via Clerk API
src/lib/actions/teacher-settings-actions.ts-274- */
src/lib/actions/teacher-settings-actions.ts:275:export async function changePassword(passwordData: {
src/lib/actions/teacher-settings-actions.ts-276-  currentPassword: string;
src/lib/actions/teacher-settings-actions.ts-277-  newPassword: string;
src/lib/actions/teacher-settings-actions.ts-278-}) {
src/lib/actions/teacher-settings-actions.ts-279-  try {
src/lib/actions/teacher-settings-actions.ts-280-    const session = await auth();
--
src/lib/actions/progressTrackingActions.ts-52- * Authorization: Teacher only (can only mark their own progress)
src/lib/actions/progressTrackingActions.ts-53- */
src/lib/actions/progressTrackingActions.ts:54:export async function markSubModuleComplete(
src/lib/actions/progressTrackingActions.ts-55-  input: MarkSubModuleCompleteInput
src/lib/actions/progressTrackingActions.ts-56-): Promise<ActionResponse> {
src/lib/actions/progressTrackingActions.ts-57-  try {
src/lib/actions/progressTrackingActions.ts-58-    // Validate input with Zod schema
src/lib/actions/progressTrackingActions.ts-59-    const validationResult = markSubModuleCompleteSchema.safeParse(input);
--
src/lib/actions/progressTrackingActions.ts-143- * Authorization: All authenticated users (admin, teacher, student)
src/lib/actions/progressTrackingActions.ts-144- */
src/lib/actions/progressTrackingActions.ts:145:export async function getModuleProgress(
src/lib/actions/progressTrackingActions.ts-146-  moduleId: string,
src/lib/actions/progressTrackingActions.ts-147-  teacherId: string
src/lib/actions/progressTrackingActions.ts-148-): Promise<ActionResponse<ModuleProgress>> {
src/lib/actions/progressTrackingActions.ts-149-  try {
src/lib/actions/progressTrackingActions.ts-150-    // Check authorization - all authenticated users can view progress
--
src/lib/actions/progressTrackingActions.ts-235- * Authorization: All authenticated users (admin, teacher, student)
src/lib/actions/progressTrackingActions.ts-236- */
src/lib/actions/progressTrackingActions.ts:237:export async function getSyllabusProgress(
src/lib/actions/progressTrackingActions.ts-238-  syllabusId: string,
src/lib/actions/progressTrackingActions.ts-239-  teacherId: string
src/lib/actions/progressTrackingActions.ts-240-): Promise<ActionResponse<SyllabusProgress>> {
src/lib/actions/progressTrackingActions.ts-241-  try {
src/lib/actions/progressTrackingActions.ts-242-    // Check authorization - all authenticated users can view progress
--
src/lib/actions/progressTrackingActions.ts-387- * Authorization: All authenticated users (admin, teacher, student)
src/lib/actions/progressTrackingActions.ts-388- */
src/lib/actions/progressTrackingActions.ts:389:export async function getBatchModuleProgress(
src/lib/actions/progressTrackingActions.ts-390-  moduleIds: string[],
src/lib/actions/progressTrackingActions.ts-391-  teacherId: string
src/lib/actions/progressTrackingActions.ts-392-): Promise<ActionResponse<ModuleProgress[]>> {
src/lib/actions/progressTrackingActions.ts-393-  try {
src/lib/actions/progressTrackingActions.ts-394-    // Check authorization - all authenticated users can view progress
--
src/lib/actions/smsActions.ts-29- * Send a single SMS message
src/lib/actions/smsActions.ts-30- */
src/lib/actions/smsActions.ts:31:export async function sendSingleSMS(data: {
src/lib/actions/smsActions.ts-32-  to: string;
src/lib/actions/smsActions.ts-33-  message: string;
src/lib/actions/smsActions.ts-34-  countryCode?: string;
src/lib/actions/smsActions.ts-35-  dltTemplateId?: string;
src/lib/actions/smsActions.ts-36-}) {
--
src/lib/actions/smsActions.ts-91- * Send bulk SMS to multiple recipients
src/lib/actions/smsActions.ts-92- */
src/lib/actions/smsActions.ts:93:export async function sendBulkSMSAction(data: {
src/lib/actions/smsActions.ts-94-  recipients: string[];
src/lib/actions/smsActions.ts-95-  message: string;
src/lib/actions/smsActions.ts-96-  countryCode?: string;
src/lib/actions/smsActions.ts-97-  dltTemplateId?: string;
src/lib/actions/smsActions.ts-98-}) {
--
src/lib/actions/smsActions.ts-171- * Get SMS delivery status
src/lib/actions/smsActions.ts-172- */
src/lib/actions/smsActions.ts:173:export async function getSMSStatus(messageId: string) {
src/lib/actions/smsActions.ts-174-  try {
src/lib/actions/smsActions.ts-175-    const user = await currentUser();
src/lib/actions/smsActions.ts-176-    if (!user) {
src/lib/actions/smsActions.ts-177-      return { success: false, error: "Unauthorized" };
src/lib/actions/smsActions.ts-178-    }
--
src/lib/actions/smsActions.ts-217- * Send SMS to parents of a specific class
src/lib/actions/smsActions.ts-218- */
src/lib/actions/smsActions.ts:219:export async function sendSMSToClass(data: {
src/lib/actions/smsActions.ts-220-  classId: string;
src/lib/actions/smsActions.ts-221-  message: string;
src/lib/actions/smsActions.ts-222-}) {
src/lib/actions/smsActions.ts-223-  try {
src/lib/actions/smsActions.ts-224-    const user = await currentUser();
--
src/lib/actions/smsActions.ts-303- * Send SMS to all parents
src/lib/actions/smsActions.ts-304- */
src/lib/actions/smsActions.ts:305:export async function sendSMSToAllParents(message: string) {
src/lib/actions/smsActions.ts-306-  try {
src/lib/actions/smsActions.ts-307-    const user = await currentUser();
src/lib/actions/smsActions.ts-308-    if (!user) {
src/lib/actions/smsActions.ts-309-      return { success: false, error: "Unauthorized" };
src/lib/actions/smsActions.ts-310-    }
--
src/lib/actions/smsActions.ts-366- * Check if SMS service is configured
src/lib/actions/smsActions.ts-367- */
src/lib/actions/smsActions.ts:368:export async function checkSMSConfiguration() {
src/lib/actions/smsActions.ts-369-  try {
src/lib/actions/smsActions.ts-370-    const user = await currentUser();
src/lib/actions/smsActions.ts-371-    if (!user) {
src/lib/actions/smsActions.ts-372-      return { success: false, error: "Unauthorized" };
src/lib/actions/smsActions.ts-373-    }
--
src/lib/actions/teacherStudentsActions.ts-8- * Get all students assigned to a teacher's classes
src/lib/actions/teacherStudentsActions.ts-9- */
src/lib/actions/teacherStudentsActions.ts:10:export async function getTeacherStudents(options?: {
src/lib/actions/teacherStudentsActions.ts-11-  search?: string;
src/lib/actions/teacherStudentsActions.ts-12-  classId?: string;
src/lib/actions/teacherStudentsActions.ts-13-  sectionId?: string;
src/lib/actions/teacherStudentsActions.ts-14-  sortBy?: string;
src/lib/actions/teacherStudentsActions.ts-15-  sortOrder?: "asc" | "desc";
--
src/lib/actions/teacherStudentsActions.ts-273- * Get a single student's details for a teacher
src/lib/actions/teacherStudentsActions.ts-274- */
src/lib/actions/teacherStudentsActions.ts:275:export async function getStudentDetails(studentId: string) {
src/lib/actions/teacherStudentsActions.ts-276-  try {
src/lib/actions/teacherStudentsActions.ts-277-    // CRITICAL: Add school isolation
src/lib/actions/teacherStudentsActions.ts-278-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherStudentsActions.ts-279-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherStudentsActions.ts-280-
--
src/lib/actions/teacherStudentsActions.ts-581- * Get students for a specific class
src/lib/actions/teacherStudentsActions.ts-582- */
src/lib/actions/teacherStudentsActions.ts:583:export async function getClassStudents(classId: string, sectionId?: string) {
src/lib/actions/teacherStudentsActions.ts-584-  try {
src/lib/actions/teacherStudentsActions.ts-585-    // CRITICAL: Add school isolation
src/lib/actions/teacherStudentsActions.ts-586-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherStudentsActions.ts-587-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherStudentsActions.ts-588-
--
src/lib/actions/teacherStudentsActions.ts-740- * Get performance overview for all students in teacher's classes
src/lib/actions/teacherStudentsActions.ts-741- */
src/lib/actions/teacherStudentsActions.ts:742:export async function getTeacherStudentsPerformance() {
src/lib/actions/teacherStudentsActions.ts-743-  try {
src/lib/actions/teacherStudentsActions.ts-744-    // CRITICAL: Add school isolation
src/lib/actions/teacherStudentsActions.ts-745-    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
src/lib/actions/teacherStudentsActions.ts-746-    const schoolId = await getRequiredSchoolId();
src/lib/actions/teacherStudentsActions.ts-747-
--
src/lib/actions/assessmentActions.ts-4-import { requireSchoolAccess } from "@/lib/auth/tenant";
src/lib/actions/assessmentActions.ts-5-
src/lib/actions/assessmentActions.ts:6:export async function getAssessmentOverview() {
src/lib/actions/assessmentActions.ts-7-  try {
src/lib/actions/assessmentActions.ts-8-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assessmentActions.ts-9-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assessmentActions.ts-10-    const [
src/lib/actions/assessmentActions.ts-11-      examTypesCount,
--
src/lib/actions/assessmentActions.ts-39-}
src/lib/actions/assessmentActions.ts-40-
src/lib/actions/assessmentActions.ts:41:export async function getRecentAssessments(limit: number = 10) {
src/lib/actions/assessmentActions.ts-42-  try {
src/lib/actions/assessmentActions.ts-43-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assessmentActions.ts-44-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assessmentActions.ts-45-    const [recentExams, recentAssignments] = await Promise.all([
src/lib/actions/assessmentActions.ts-46-      db.exam.findMany({
--
src/lib/actions/assessmentActions.ts-110-}
src/lib/actions/assessmentActions.ts-111-
src/lib/actions/assessmentActions.ts:112:export async function getAssessmentMetrics() {
src/lib/actions/assessmentActions.ts-113-  try {
src/lib/actions/assessmentActions.ts-114-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/assessmentActions.ts-115-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/assessmentActions.ts-116-    const [examsCount, assignmentsCount, results, reportCards] = await Promise.all([
src/lib/actions/assessmentActions.ts-117-      db.exam.count({ where: { schoolId } }),
--
src/lib/actions/scheduledBackupActions.ts-22- * Get the status of scheduled backups
src/lib/actions/scheduledBackupActions.ts-23- */
src/lib/actions/scheduledBackupActions.ts:24:export async function getScheduledBackupStatusAction() {
src/lib/actions/scheduledBackupActions.ts-25-  try {
src/lib/actions/scheduledBackupActions.ts-26-    const session = await auth();
src/lib/actions/scheduledBackupActions.ts-27-    const userId = session?.user?.id;
src/lib/actions/scheduledBackupActions.ts-28-
src/lib/actions/scheduledBackupActions.ts-29-    if (!userId) {
--
src/lib/actions/scheduledBackupActions.ts-64- * Start scheduled backups
src/lib/actions/scheduledBackupActions.ts-65- */
src/lib/actions/scheduledBackupActions.ts:66:export async function startScheduledBackupsAction() {
src/lib/actions/scheduledBackupActions.ts-67-  try {
src/lib/actions/scheduledBackupActions.ts-68-    const session = await auth();
src/lib/actions/scheduledBackupActions.ts-69-    const userId = session?.user?.id;
src/lib/actions/scheduledBackupActions.ts-70-
src/lib/actions/scheduledBackupActions.ts-71-    if (!userId) {
--
src/lib/actions/scheduledBackupActions.ts-115- * Stop scheduled backups
src/lib/actions/scheduledBackupActions.ts-116- */
src/lib/actions/scheduledBackupActions.ts:117:export async function stopScheduledBackupsAction() {
src/lib/actions/scheduledBackupActions.ts-118-  try {
src/lib/actions/scheduledBackupActions.ts-119-    const session = await auth();
src/lib/actions/scheduledBackupActions.ts-120-    const userId = session?.user?.id;
src/lib/actions/scheduledBackupActions.ts-121-
src/lib/actions/scheduledBackupActions.ts-122-    if (!userId) {
--
src/lib/actions/scheduledBackupActions.ts-166- * Trigger a manual backup immediately
src/lib/actions/scheduledBackupActions.ts-167- */
src/lib/actions/scheduledBackupActions.ts:168:export async function triggerManualBackupAction() {
src/lib/actions/scheduledBackupActions.ts-169-  try {
src/lib/actions/scheduledBackupActions.ts-170-    const session = await auth();
src/lib/actions/scheduledBackupActions.ts-171-    const userId = session?.user?.id;
src/lib/actions/scheduledBackupActions.ts-172-
src/lib/actions/scheduledBackupActions.ts-173-    if (!userId) {
--
src/lib/actions/upload-actions.ts-8- * Server action for uploading images with proper authentication context
src/lib/actions/upload-actions.ts-9- */
src/lib/actions/upload-actions.ts:10:export async function uploadImageAction(formData: FormData) {
src/lib/actions/upload-actions.ts-11-  try {
src/lib/actions/upload-actions.ts-12-    // Get the file from form data
src/lib/actions/upload-actions.ts-13-    const file = formData.get('file') as File;
src/lib/actions/upload-actions.ts-14-    if (!file) {
src/lib/actions/upload-actions.ts-15-      return {
--
src/lib/actions/upload-actions.ts-117- * Server action for uploading documents with proper authentication context
src/lib/actions/upload-actions.ts-118- */
src/lib/actions/upload-actions.ts:119:export async function uploadDocumentAction(formData: FormData) {
src/lib/actions/upload-actions.ts-120-  try {
src/lib/actions/upload-actions.ts-121-    // Get the file from form data
src/lib/actions/upload-actions.ts-122-    const file = formData.get('file') as File;
src/lib/actions/upload-actions.ts-123-    if (!file) {
src/lib/actions/upload-actions.ts-124-      return {
--
src/lib/actions/examTypesActions.ts-7-
src/lib/actions/examTypesActions.ts-8-// Fetch all exam types
src/lib/actions/examTypesActions.ts:9:export async function getExamTypes() {
src/lib/actions/examTypesActions.ts-10-  try {
src/lib/actions/examTypesActions.ts-11-    const examTypes = await db.examType.findMany({
src/lib/actions/examTypesActions.ts-12-      include: {
src/lib/actions/examTypesActions.ts-13-        _count: {
src/lib/actions/examTypesActions.ts-14-          select: {
--
src/lib/actions/examTypesActions.ts-47-
src/lib/actions/examTypesActions.ts-48-// Get an exam type by ID
src/lib/actions/examTypesActions.ts:49:export async function getExamTypeById(id: string) {
src/lib/actions/examTypesActions.ts-50-  try {
src/lib/actions/examTypesActions.ts-51-    const examType = await db.examType.findUnique({
src/lib/actions/examTypesActions.ts-52-      where: { id },
src/lib/actions/examTypesActions.ts-53-      include: {
src/lib/actions/examTypesActions.ts-54-        _count: {
--
src/lib/actions/examTypesActions.ts-89-
src/lib/actions/examTypesActions.ts-90-// Create a new exam type
src/lib/actions/examTypesActions.ts:91:export async function createExamType(data: ExamTypeFormValues) {
src/lib/actions/examTypesActions.ts-92-  try {
src/lib/actions/examTypesActions.ts-93-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/examTypesActions.ts-94-    if (!schoolId) return { success: false, error: "School context required" };
src/lib/actions/examTypesActions.ts-95-    
src/lib/actions/examTypesActions.ts-96-    // Check if an exam type with this name already exists
--
src/lib/actions/examTypesActions.ts-135-
src/lib/actions/examTypesActions.ts-136-// Update an existing exam type
src/lib/actions/examTypesActions.ts:137:export async function updateExamType(data: ExamTypeUpdateFormValues) {
src/lib/actions/examTypesActions.ts-138-  try {
src/lib/actions/examTypesActions.ts-139-    // Check if an exam type with this name already exists (excluding the current one)
src/lib/actions/examTypesActions.ts-140-    const existingType = await db.examType.findFirst({
src/lib/actions/examTypesActions.ts-141-      where: {
src/lib/actions/examTypesActions.ts-142-        name: {
--
src/lib/actions/examTypesActions.ts-178-
src/lib/actions/examTypesActions.ts-179-// Delete an exam type
src/lib/actions/examTypesActions.ts:180:export async function deleteExamType(id: string) {
src/lib/actions/examTypesActions.ts-181-  try {
src/lib/actions/examTypesActions.ts-182-    // Check if any exams are using this exam type
src/lib/actions/examTypesActions.ts-183-    const examCount = await db.exam.count({
src/lib/actions/examTypesActions.ts-184-      where: { examTypeId: id }
src/lib/actions/examTypesActions.ts-185-    });
--
src/lib/actions/examTypesActions.ts-208-
src/lib/actions/examTypesActions.ts-209-// Get exam statistics by type
src/lib/actions/examTypesActions.ts:210:export async function getExamStatsByType(id: string) {
src/lib/actions/examTypesActions.ts-211-  try {
src/lib/actions/examTypesActions.ts-212-    const exams = await db.exam.findMany({
src/lib/actions/examTypesActions.ts-213-      where: { examTypeId: id },
src/lib/actions/examTypesActions.ts-214-      include: {
src/lib/actions/examTypesActions.ts-215-        results: true
--
src/lib/actions/questionBankActions.ts-10- * Create a new question in the question bank
src/lib/actions/questionBankActions.ts-11- */
src/lib/actions/questionBankActions.ts:12:export async function createQuestion(data: {
src/lib/actions/questionBankActions.ts-13-  question: string;
src/lib/actions/questionBankActions.ts-14-  questionType: QuestionType;
src/lib/actions/questionBankActions.ts-15-  options?: string[]; // For MCQ
src/lib/actions/questionBankActions.ts-16-  correctAnswer?: string;
src/lib/actions/questionBankActions.ts-17-  marks: number;
--
src/lib/actions/questionBankActions.ts-98- * Get all questions created by the teacher with optional filters
src/lib/actions/questionBankActions.ts-99- */
src/lib/actions/questionBankActions.ts:100:export async function getTeacherQuestions(filters?: {
src/lib/actions/questionBankActions.ts-101-  subjectId?: string;
src/lib/actions/questionBankActions.ts-102-  topic?: string;
src/lib/actions/questionBankActions.ts-103-  difficulty?: Difficulty;
src/lib/actions/questionBankActions.ts-104-  questionType?: QuestionType;
src/lib/actions/questionBankActions.ts-105-  search?: string;
--
src/lib/actions/questionBankActions.ts-175- * Get a single question by ID
src/lib/actions/questionBankActions.ts-176- */
src/lib/actions/questionBankActions.ts:177:export async function getQuestionById(questionId: string) {
src/lib/actions/questionBankActions.ts-178-  try {
src/lib/actions/questionBankActions.ts-179-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/questionBankActions.ts-180-    if (!schoolId) throw new Error("School context required");
src/lib/actions/questionBankActions.ts-181-    const session = await auth();
src/lib/actions/questionBankActions.ts-182-    const userId = session?.user?.id;
--
src/lib/actions/questionBankActions.ts-211- * Update an existing question
src/lib/actions/questionBankActions.ts-212- */
src/lib/actions/questionBankActions.ts:213:export async function updateQuestion(
src/lib/actions/questionBankActions.ts-214-  questionId: string,
src/lib/actions/questionBankActions.ts-215-  data: {
src/lib/actions/questionBankActions.ts-216-    question?: string;
src/lib/actions/questionBankActions.ts-217-    questionType?: QuestionType;
src/lib/actions/questionBankActions.ts-218-    options?: string[];
--
src/lib/actions/questionBankActions.ts-323- * Delete a question
src/lib/actions/questionBankActions.ts-324- */
src/lib/actions/questionBankActions.ts:325:export async function deleteQuestion(questionId: string) {
src/lib/actions/questionBankActions.ts-326-  try {
src/lib/actions/questionBankActions.ts-327-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/questionBankActions.ts-328-    if (!schoolId) throw new Error("School context required");
src/lib/actions/questionBankActions.ts-329-    const session = await auth();
src/lib/actions/questionBankActions.ts-330-    const userId = session?.user?.id;
--
src/lib/actions/questionBankActions.ts-375- * Get unique topics for a subject (for the current teacher)
src/lib/actions/questionBankActions.ts-376- */
src/lib/actions/questionBankActions.ts:377:export async function getTeacherSubjectTopics(subjectId: string) {
src/lib/actions/questionBankActions.ts-378-  try {
src/lib/actions/questionBankActions.ts-379-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/questionBankActions.ts-380-    if (!schoolId) throw new Error("School context required");
src/lib/actions/questionBankActions.ts-381-    const session = await auth();
src/lib/actions/questionBankActions.ts-382-    const userId = session?.user?.id;
--
src/lib/actions/questionBankActions.ts-422- * Get question bank statistics for the teacher
src/lib/actions/questionBankActions.ts-423- */
src/lib/actions/questionBankActions.ts:424:export async function getQuestionBankStats() {
src/lib/actions/questionBankActions.ts-425-  try {
src/lib/actions/questionBankActions.ts-426-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/questionBankActions.ts-427-    if (!schoolId) throw new Error("School context required");
src/lib/actions/questionBankActions.ts-428-    const session = await auth();
src/lib/actions/questionBankActions.ts-429-    const userId = session?.user?.id;
--
src/lib/actions/questionBankActions.ts-510- * Bulk import questions from CSV or JSON
src/lib/actions/questionBankActions.ts-511- */
src/lib/actions/questionBankActions.ts:512:export async function bulkImportQuestions(data: {
src/lib/actions/questionBankActions.ts-513-  subjectId: string;
src/lib/actions/questionBankActions.ts-514-  questions: Array<{
src/lib/actions/questionBankActions.ts-515-    question: string;
src/lib/actions/questionBankActions.ts-516-    questionType: QuestionType;
src/lib/actions/questionBankActions.ts-517-    options?: string[];
--
src/lib/actions/msg91Actions.ts-45- * @returns Action result with message ID
src/lib/actions/msg91Actions.ts-46- */
src/lib/actions/msg91Actions.ts:47:export async function sendMSG91SMS(data: {
src/lib/actions/msg91Actions.ts-48-  to: string;
src/lib/actions/msg91Actions.ts-49-  message: string;
src/lib/actions/msg91Actions.ts-50-  dltTemplateId?: string;
src/lib/actions/msg91Actions.ts-51-  countryCode?: string;
src/lib/actions/msg91Actions.ts-52-}): Promise<ActionResult<{ messageId: string }>> {
--
src/lib/actions/msg91Actions.ts-142- * @returns Action result with delivery summary
src/lib/actions/msg91Actions.ts-143- */
src/lib/actions/msg91Actions.ts:144:export async function sendBulkMSG91SMS(data: {
src/lib/actions/msg91Actions.ts-145-  recipients: string[];
src/lib/actions/msg91Actions.ts-146-  message: string;
src/lib/actions/msg91Actions.ts-147-  dltTemplateId?: string;
src/lib/actions/msg91Actions.ts-148-  countryCode?: string;
src/lib/actions/msg91Actions.ts-149-}): Promise<ActionResult<{
--
src/lib/actions/msg91Actions.ts-275- * @returns Action result with delivery status
src/lib/actions/msg91Actions.ts-276- */
src/lib/actions/msg91Actions.ts:277:export async function getMSG91Status(
src/lib/actions/msg91Actions.ts-278-  messageId: string
src/lib/actions/msg91Actions.ts-279-): Promise<ActionResult<{
src/lib/actions/msg91Actions.ts-280-  status: string;
src/lib/actions/msg91Actions.ts-281-  description?: string;
src/lib/actions/msg91Actions.ts-282-  deliveredAt?: Date;
--
src/lib/actions/msg91Actions.ts-333- * @returns Action result with configuration status
src/lib/actions/msg91Actions.ts-334- */
src/lib/actions/msg91Actions.ts:335:export async function checkMSG91ConfigurationAction(): Promise<ActionResult<{
src/lib/actions/msg91Actions.ts-336-  configured: boolean;
src/lib/actions/msg91Actions.ts-337-  authKey: boolean;
src/lib/actions/msg91Actions.ts-338-  senderId: boolean;
src/lib/actions/msg91Actions.ts-339-  route: string;
src/lib/actions/msg91Actions.ts-340-  country: string;
--
src/lib/actions/teacherAttendanceActions.ts-18- * Get students for a class to mark attendance
src/lib/actions/teacherAttendanceActions.ts-19- */
src/lib/actions/teacherAttendanceActions.ts:20:export async function getClassStudentsForAttendance(classId: string, sectionId?: string) {
src/lib/actions/teacherAttendanceActions.ts-21-  try {
src/lib/actions/teacherAttendanceActions.ts-22-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAttendanceActions.ts-23-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAttendanceActions.ts-24-    const session = await auth();
src/lib/actions/teacherAttendanceActions.ts-25-    const userId = session?.user?.id;
--
src/lib/actions/teacherAttendanceActions.ts-309- * Only returns classes where the teacher is a Head Class Teacher
src/lib/actions/teacherAttendanceActions.ts-310- */
src/lib/actions/teacherAttendanceActions.ts:311:export async function getTeacherClassesForAttendance() {
src/lib/actions/teacherAttendanceActions.ts-312-  try {
src/lib/actions/teacherAttendanceActions.ts-313-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAttendanceActions.ts-314-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAttendanceActions.ts-315-    const session = await auth();
src/lib/actions/teacherAttendanceActions.ts-316-    const userId = session?.user?.id;
--
src/lib/actions/teacherAttendanceActions.ts-379- * Save attendance records for students
src/lib/actions/teacherAttendanceActions.ts-380- */
src/lib/actions/teacherAttendanceActions.ts:381:export async function saveAttendanceRecords(classId: string, sectionId: string, attendanceRecords: StudentAttendanceData[]) {
src/lib/actions/teacherAttendanceActions.ts-382-  try {
src/lib/actions/teacherAttendanceActions.ts-383-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAttendanceActions.ts-384-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAttendanceActions.ts-385-    const session = await auth();
src/lib/actions/teacherAttendanceActions.ts-386-    const userId = session?.user?.id;
--
src/lib/actions/teacherAttendanceActions.ts-512- * Get attendance records for a class on a specific date
src/lib/actions/teacherAttendanceActions.ts-513- */
src/lib/actions/teacherAttendanceActions.ts:514:export async function getClassAttendanceForDate(classId: string, sectionId: string, date: string) {
src/lib/actions/teacherAttendanceActions.ts-515-  try {
src/lib/actions/teacherAttendanceActions.ts-516-    const { schoolId } = await requireSchoolAccess();
src/lib/actions/teacherAttendanceActions.ts-517-    if (!schoolId) throw new Error("School context required");
src/lib/actions/teacherAttendanceActions.ts-518-    const session = await auth();
src/lib/actions/teacherAttendanceActions.ts-519-    const userId = session?.user?.id;
--
src/lib/actions/teacherAttendanceActions.ts-654- * Get attendance reports for a teacher's classes
src/lib/actions/teacherAttendanceActions.ts-655- */
src/lib/actions/teacherAttendanceActions.ts:656:export async function getTeacherAttendanceReports(filters?: {
src/lib/actions/teacherAttendanceActions.ts-657-  classId?: string;
src/lib/actions/teacherAttendanceActions.ts-658-  sectionId?: string;
src/lib/actions/teacherAttendanceActions.ts-659-  startDate?: string;
src/lib/actions/teacherAttendanceActions.ts-660-  endDate?: string;
src/lib/actions/teacherAttendanceActions.ts-661-  status?: AttendanceStatus;
--
src/lib/actions/teacherAttendanceActions.ts-982- * Get a single student's attendance report
src/lib/actions/teacherAttendanceActions.ts-983- */
src/lib/actions/teacherAttendanceActions.ts:984:export async function getStudentAttendanceReport(studentId: string, filters?: {
src/lib/actions/teacherAttendanceActions.ts-985-  startDate?: string;
src/lib/actions/teacherAttendanceActions.ts-986-  endDate?: string;
src/lib/actions/teacherAttendanceActions.ts-987-}) {
src/lib/actions/teacherAttendanceActions.ts-988-  try {
src/lib/actions/teacherAttendanceActions.ts-989-    const session = await auth();
--
src/lib/actions/student-notes-actions.ts-21- * Get all notes for a student
src/lib/actions/student-notes-actions.ts-22- */
src/lib/actions/student-notes-actions.ts:23:export async function getStudentNotes(studentId?: string) {
src/lib/actions/student-notes-actions.ts-24-  try {
src/lib/actions/student-notes-actions.ts-25-    const session = await auth();
src/lib/actions/student-notes-actions.ts-26-    if (!session?.user?.id) {
src/lib/actions/student-notes-actions.ts-27-      throw new Error("Not authenticated");
src/lib/actions/student-notes-actions.ts-28-    }
--
src/lib/actions/student-notes-actions.ts-72- * Create a new note
src/lib/actions/student-notes-actions.ts-73- */
src/lib/actions/student-notes-actions.ts:74:export async function createStudentNote(data: {
src/lib/actions/student-notes-actions.ts-75-  title: string;
src/lib/actions/student-notes-actions.ts-76-  content: string;
src/lib/actions/student-notes-actions.ts-77-  subject: string;
src/lib/actions/student-notes-actions.ts-78-  tags?: string[];
src/lib/actions/student-notes-actions.ts-79-  folder?: string;
--
src/lib/actions/student-notes-actions.ts-122- * Update an existing note
src/lib/actions/student-notes-actions.ts-123- */
src/lib/actions/student-notes-actions.ts:124:export async function updateStudentNote(
src/lib/actions/student-notes-actions.ts-125-  noteId: string,
src/lib/actions/student-notes-actions.ts-126-  data: {
src/lib/actions/student-notes-actions.ts-127-    title?: string;
src/lib/actions/student-notes-actions.ts-128-    content?: string;
src/lib/actions/student-notes-actions.ts-129-    subject?: string;
--
src/lib/actions/student-notes-actions.ts-185- * Delete a note
src/lib/actions/student-notes-actions.ts-186- */
src/lib/actions/student-notes-actions.ts:187:export async function deleteStudentNote(noteId: string) {
src/lib/actions/student-notes-actions.ts-188-  try {
src/lib/actions/student-notes-actions.ts-189-    const session = await auth();
src/lib/actions/student-notes-actions.ts-190-    if (!session?.user?.id) {
src/lib/actions/student-notes-actions.ts-191-      throw new Error("Not authenticated");
src/lib/actions/student-notes-actions.ts-192-    }
--
src/lib/actions/student-notes-actions.ts-230- * Search notes by title, content, or tags
src/lib/actions/student-notes-actions.ts-231- */
src/lib/actions/student-notes-actions.ts:232:export async function searchStudentNotes(query: string, studentId?: string) {
src/lib/actions/student-notes-actions.ts-233-  try {
src/lib/actions/student-notes-actions.ts-234-    const session = await auth();
src/lib/actions/student-notes-actions.ts-235-    if (!session?.user?.id) {
src/lib/actions/student-notes-actions.ts-236-      throw new Error("Not authenticated");
src/lib/actions/student-notes-actions.ts-237-    }
--
src/lib/actions/student-notes-actions.ts-287- * Get notes by subject
src/lib/actions/student-notes-actions.ts-288- */
src/lib/actions/student-notes-actions.ts:289:export async function getNotesBySubject(subject: string, studentId?: string) {
src/lib/actions/student-notes-actions.ts-290-  try {
src/lib/actions/student-notes-actions.ts-291-    const session = await auth();
src/lib/actions/student-notes-actions.ts-292-    if (!session?.user?.id) {
src/lib/actions/student-notes-actions.ts-293-      throw new Error("Not authenticated");
src/lib/actions/student-notes-actions.ts-294-    }
--
src/lib/actions/student-notes-actions.ts-339- * Get notes by folder
src/lib/actions/student-notes-actions.ts-340- */
src/lib/actions/student-notes-actions.ts:341:export async function getNotesByFolder(folder: string, studentId?: string) {
src/lib/actions/student-notes-actions.ts-342-  try {
src/lib/actions/student-notes-actions.ts-343-    const session = await auth();
src/lib/actions/student-notes-actions.ts-344-    if (!session?.user?.id) {
src/lib/actions/student-notes-actions.ts-345-      throw new Error("Not authenticated");
src/lib/actions/student-notes-actions.ts-346-    }
--
src/lib/actions/parent-fee-actions.ts-114- * Requirements: 12.1, 12.4
src/lib/actions/parent-fee-actions.ts-115- */
src/lib/actions/parent-fee-actions.ts:116:export async function getFeeOverview(input: FeeOverviewInput) {
src/lib/actions/parent-fee-actions.ts-117-  try {
src/lib/actions/parent-fee-actions.ts-118-    // Validate input
src/lib/actions/parent-fee-actions.ts-119-    const validated = feeOverviewSchema.parse(input);
src/lib/actions/parent-fee-actions.ts-120-
src/lib/actions/parent-fee-actions.ts-121-    // Get current parent
--
src/lib/actions/parent-fee-actions.ts-334- * Requirements: 12.2, 12.3
src/lib/actions/parent-fee-actions.ts-335- */
src/lib/actions/parent-fee-actions.ts:336:export async function getPaymentHistory(filters: PaymentHistoryFilter) {
src/lib/actions/parent-fee-actions.ts-337-  try {
src/lib/actions/parent-fee-actions.ts-338-    // Validate input
src/lib/actions/parent-fee-actions.ts-339-    const validated = paymentHistoryFilterSchema.parse(filters);
src/lib/actions/parent-fee-actions.ts-340-
src/lib/actions/parent-fee-actions.ts-341-    // Get current parent
--
src/lib/actions/parent-fee-actions.ts-455- * Requirements: 12.2, 12.3
src/lib/actions/parent-fee-actions.ts-456- */
src/lib/actions/parent-fee-actions.ts:457:export async function createPayment(input: CreatePaymentInput & { csrfToken?: string }) {
src/lib/actions/parent-fee-actions.ts-458-  try {
src/lib/actions/parent-fee-actions.ts-459-    // Verify CSRF token
src/lib/actions/parent-fee-actions.ts-460-    if (input.csrfToken) {
src/lib/actions/parent-fee-actions.ts-461-      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
src/lib/actions/parent-fee-actions.ts-462-      if (!isCsrfValid) {
--
src/lib/actions/parent-fee-actions.ts-586- * Requirements: 1.3, 10.1, 10.2
src/lib/actions/parent-fee-actions.ts-587- */
src/lib/actions/parent-fee-actions.ts:588:export async function verifyPayment(input: VerifyPaymentInput & { csrfToken?: string }) {
src/lib/actions/parent-fee-actions.ts-589-  try {
src/lib/actions/parent-fee-actions.ts-590-    // Verify CSRF token
src/lib/actions/parent-fee-actions.ts-591-    if (input.csrfToken) {
src/lib/actions/parent-fee-actions.ts-592-      const isCsrfValid = await verifyCsrfToken(input.csrfToken);
src/lib/actions/parent-fee-actions.ts-593-      if (!isCsrfValid) {
--
src/lib/actions/parent-fee-actions.ts-714- * Requirements: 12.2, 12.3
src/lib/actions/parent-fee-actions.ts-715- */
src/lib/actions/parent-fee-actions.ts:716:export async function downloadReceipt(input: DownloadReceiptInput) {
src/lib/actions/parent-fee-actions.ts-717-  try {
src/lib/actions/parent-fee-actions.ts-718-    // Validate input
src/lib/actions/parent-fee-actions.ts-719-    const validated = downloadReceiptSchema.parse(input);
src/lib/actions/parent-fee-actions.ts-720-
src/lib/actions/parent-fee-actions.ts-721-    // Get current parent
--
src/lib/actions/student-attendance-actions.ts-75- * Get student attendance report for a specific month
src/lib/actions/student-attendance-actions.ts-76- */
src/lib/actions/student-attendance-actions.ts:77:export async function getStudentAttendanceReport(month: Date = new Date()) {
src/lib/actions/student-attendance-actions.ts-78-  const student = await getCurrentStudent();
src/lib/actions/student-attendance-actions.ts-79-
src/lib/actions/student-attendance-actions.ts-80-  if (!student) {
src/lib/actions/student-attendance-actions.ts-81-    redirect("/login");
src/lib/actions/student-attendance-actions.ts-82-  }
--
src/lib/actions/student-attendance-actions.ts-170- * Get attendance trends for the past 6 months
src/lib/actions/student-attendance-actions.ts-171- */
src/lib/actions/student-attendance-actions.ts:172:export async function getAttendanceTrends() {
src/lib/actions/student-attendance-actions.ts-173-  const student = await getCurrentStudent();
src/lib/actions/student-attendance-actions.ts-174-
src/lib/actions/student-attendance-actions.ts-175-  if (!student) {
src/lib/actions/student-attendance-actions.ts-176-    redirect("/login");
src/lib/actions/student-attendance-actions.ts-177-  }
--
src/lib/actions/student-attendance-actions.ts-227- * Get student's leave applications
src/lib/actions/student-attendance-actions.ts-228- */
src/lib/actions/student-attendance-actions.ts:229:export async function getStudentLeaveApplications() {
src/lib/actions/student-attendance-actions.ts-230-  const student = await getCurrentStudent();
src/lib/actions/student-attendance-actions.ts-231-
src/lib/actions/student-attendance-actions.ts-232-  if (!student) {
src/lib/actions/student-attendance-actions.ts-233-    redirect("/login");
src/lib/actions/student-attendance-actions.ts-234-  }
--
src/lib/actions/student-attendance-actions.ts-250- * Submit a leave application
src/lib/actions/student-attendance-actions.ts-251- */
src/lib/actions/student-attendance-actions.ts:252:export async function submitLeaveApplication(values: LeaveApplicationValues) {
src/lib/actions/student-attendance-actions.ts-253-  const student = await getCurrentStudent();
src/lib/actions/student-attendance-actions.ts-254-
src/lib/actions/student-attendance-actions.ts-255-  if (!student) {
src/lib/actions/student-attendance-actions.ts-256-    return { success: false, message: "Authentication required" };
src/lib/actions/student-attendance-actions.ts-257-  }
--
src/lib/actions/student-attendance-actions.ts-339- * Cancel a leave application
src/lib/actions/student-attendance-actions.ts-340- */
src/lib/actions/student-attendance-actions.ts:341:export async function cancelLeaveApplication(id: string) {
src/lib/actions/student-attendance-actions.ts-342-  const student = await getCurrentStudent();
src/lib/actions/student-attendance-actions.ts-343-
src/lib/actions/student-attendance-actions.ts-344-  if (!student) {
src/lib/actions/student-attendance-actions.ts-345-    return { success: false, message: "Authentication required" };
src/lib/actions/student-attendance-actions.ts-346-  }
--
src/lib/actions/parent-meeting-actions.ts-45- * Requirements: 1.1, 1.2, 1.3
src/lib/actions/parent-meeting-actions.ts-46- */
src/lib/actions/parent-meeting-actions.ts:47:export async function scheduleMeeting(formData: FormData, schoolId: string) {
src/lib/actions/parent-meeting-actions.ts-48-  try {
src/lib/actions/parent-meeting-actions.ts-49-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-50-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-51-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-52-    if (!userId) {
--
src/lib/actions/parent-meeting-actions.ts-205- * Requirements: 1.2
src/lib/actions/parent-meeting-actions.ts-206- */
src/lib/actions/parent-meeting-actions.ts:207:export async function getUpcomingMeetings(parentId: string) {
src/lib/actions/parent-meeting-actions.ts-208-  try {
src/lib/actions/parent-meeting-actions.ts-209-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-210-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-211-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-212-    if (!userId) {
--
src/lib/actions/parent-meeting-actions.ts-271- * Requirements: 1.3
src/lib/actions/parent-meeting-actions.ts-272- */
src/lib/actions/parent-meeting-actions.ts:273:export async function getMeetingHistory(params: {
src/lib/actions/parent-meeting-actions.ts-274-  parentId: string;
src/lib/actions/parent-meeting-actions.ts-275-  status?: "COMPLETED" | "CANCELLED" | "ALL";
src/lib/actions/parent-meeting-actions.ts-276-  dateFrom?: string;
src/lib/actions/parent-meeting-actions.ts-277-  dateTo?: string;
src/lib/actions/parent-meeting-actions.ts-278-  limit?: number;
--
src/lib/actions/parent-meeting-actions.ts-381- * Requirements: 1.4
src/lib/actions/parent-meeting-actions.ts-382- */
src/lib/actions/parent-meeting-actions.ts:383:export async function cancelMeeting(formData: FormData, schoolId: string) {
src/lib/actions/parent-meeting-actions.ts-384-  try {
src/lib/actions/parent-meeting-actions.ts-385-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-386-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-387-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-388-    if (!userId) {
--
src/lib/actions/parent-meeting-actions.ts-488- * Requirements: 1.5
src/lib/actions/parent-meeting-actions.ts-489- */
src/lib/actions/parent-meeting-actions.ts:490:export async function rescheduleMeeting(formData: FormData, schoolId: string) {
src/lib/actions/parent-meeting-actions.ts-491-  try {
src/lib/actions/parent-meeting-actions.ts-492-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-493-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-494-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-495-    if (!userId) {
--
src/lib/actions/parent-meeting-actions.ts-643- * Requirements: 1.2
src/lib/actions/parent-meeting-actions.ts-644- */
src/lib/actions/parent-meeting-actions.ts:645:export async function getTeacherAvailability(teacherId: string, date: string) {
src/lib/actions/parent-meeting-actions.ts-646-  try {
src/lib/actions/parent-meeting-actions.ts-647-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-648-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-649-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-650-    if (!userId) {
--
src/lib/actions/parent-meeting-actions.ts-747- * Requirements: 1.1
src/lib/actions/parent-meeting-actions.ts-748- */
src/lib/actions/parent-meeting-actions.ts:749:export async function getTeachersForMeetings() {
src/lib/actions/parent-meeting-actions.ts-750-  try {
src/lib/actions/parent-meeting-actions.ts-751-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-752-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-753-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-754-    if (!userId) {
--
src/lib/actions/parent-meeting-actions.ts-801- * Requirements: 1.2, 1.3
src/lib/actions/parent-meeting-actions.ts-802- */
src/lib/actions/parent-meeting-actions.ts:803:export async function getMeetingById(meetingId: string) {
src/lib/actions/parent-meeting-actions.ts-804-  try {
src/lib/actions/parent-meeting-actions.ts-805-    // 1. Authentication check
src/lib/actions/parent-meeting-actions.ts-806-    const session = await auth();
src/lib/actions/parent-meeting-actions.ts-807-    const userId = session?.user?.id;
src/lib/actions/parent-meeting-actions.ts-808-    if (!userId) {
--
src/lib/actions/permission-examples.ts-102- * Useful when you need more control over the flow
src/lib/actions/permission-examples.ts-103- */
src/lib/actions/permission-examples.ts:104:export async function deleteUserExample(userId: string): Promise<ActionResult> {
src/lib/actions/permission-examples.ts-105-  try {
src/lib/actions/permission-examples.ts-106-    const session = await auth();
src/lib/actions/permission-examples.ts-107-    const currentUserId = session?.user?.id;
src/lib/actions/permission-examples.ts-108-
src/lib/actions/permission-examples.ts-109-    if (!currentUserId) {
--
src/lib/actions/permission-examples.ts-142- * Example 5: Using requireAllPermissions for complex permission logic
src/lib/actions/permission-examples.ts-143- */
src/lib/actions/permission-examples.ts:144:export async function approvePaymentExample(paymentId: string): Promise<ActionResult> {
src/lib/actions/permission-examples.ts-145-  try {
src/lib/actions/permission-examples.ts-146-    const session = await auth();
src/lib/actions/permission-examples.ts-147-    const userId = session?.user?.id;
src/lib/actions/permission-examples.ts-148-
src/lib/actions/permission-examples.ts-149-    if (!userId) {
--
src/lib/actions/permission-examples.ts-178- * Use when you need to show different behavior based on permissions
src/lib/actions/permission-examples.ts-179- */
src/lib/actions/permission-examples.ts:180:export async function getUserDetailsExample(targetUserId: string): Promise<ActionResult> {
src/lib/actions/permission-examples.ts-181-  try {
src/lib/actions/permission-examples.ts-182-    const session = await auth();
src/lib/actions/permission-examples.ts-183-    const userId = session?.user?.id;
src/lib/actions/permission-examples.ts-184-
src/lib/actions/permission-examples.ts-185-    if (!userId) {
--
src/lib/actions/permission-examples.ts-227- * This pattern is used in page components
src/lib/actions/permission-examples.ts-228- */
src/lib/actions/permission-examples.ts:229:export async function checkUserPermissionsForPage() {
src/lib/actions/permission-examples.ts-230-  const session = await auth();
src/lib/actions/permission-examples.ts-231-  const userId = session?.user?.id;
src/lib/actions/permission-examples.ts-232-
src/lib/actions/permission-examples.ts-233-  if (!userId) {
src/lib/actions/permission-examples.ts-234-    return {

---

## Database Queries in Pages

No issues found

---


## Summary

Scan completed at: Sun Feb  8 11:11:44 PM IST 2026

Total database queries found: 167

