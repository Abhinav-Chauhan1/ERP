-- CreateIndex
CREATE INDEX "TeacherAttendance_schoolId_date_idx" ON "TeacherAttendance"("schoolId", "date");

-- CreateIndex
CREATE INDEX "LeaveApplication_applicantId_status_idx" ON "LeaveApplication"("applicantId", "status");
