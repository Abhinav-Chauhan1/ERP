import * as z from "zod";

// Student Attendance Schema
export const studentAttendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  sectionId: z.string().min(1, "Class section is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"], {
    required_error: "Status is required",
  }),
  reason: z.string().optional(),
});

export const bulkStudentAttendanceSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  sectionId: z.string().min(1, "Class section is required"),
  attendanceRecords: z.array(
    z.object({
      studentId: z.string().min(1, "Student is required"),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]),
      reason: z.string().optional(),
    })
  ),
});

export const studentAttendanceUpdateSchema = studentAttendanceSchema.extend({
  id: z.string().min(1, "Attendance ID is required"),
});

// Teacher Attendance Schema
export const teacherAttendanceSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"], {
    required_error: "Status is required",
  }),
  reason: z.string().optional(),
});

export const bulkTeacherAttendanceSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  attendanceRecords: z.array(
    z.object({
      teacherId: z.string().min(1, "Teacher is required"),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]),
      reason: z.string().optional(),
    })
  ),
});

export const teacherAttendanceUpdateSchema = teacherAttendanceSchema.extend({
  id: z.string().min(1, "Attendance ID is required"),
});

// Attendance Report Schema
export const attendanceReportSchema = z.object({
  entityType: z.enum(["STUDENT", "TEACHER"], {
    required_error: "Entity type is required",
  }),
  entityId: z.string().optional(),
  sectionId: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
});

// Types
export type StudentAttendanceFormValues = z.infer<typeof studentAttendanceSchema>;
export type BulkStudentAttendanceFormValues = z.infer<typeof bulkStudentAttendanceSchema>;
export type StudentAttendanceUpdateFormValues = z.infer<typeof studentAttendanceUpdateSchema>;
export type TeacherAttendanceFormValues = z.infer<typeof teacherAttendanceSchema>;
export type BulkTeacherAttendanceFormValues = z.infer<typeof bulkTeacherAttendanceSchema>;
export type TeacherAttendanceUpdateFormValues = z.infer<typeof teacherAttendanceUpdateSchema>;
export type AttendanceReportFormValues = z.infer<typeof attendanceReportSchema>;
