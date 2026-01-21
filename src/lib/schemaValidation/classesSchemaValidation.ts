import * as z from "zod";

export const classSchema = z.object({
  name: z.string().min(3, "Class name must be at least 3 characters"),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  description: z.string().optional(),
  reportCardTemplateId: z.string().optional().nullable(),
});

export const classUpdateSchema = classSchema.extend({
  id: z.string().min(1, "Class ID is required"),
});

export const classSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  classId: z.string({
    required_error: "Class ID is required",
  }),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").optional(),
});

export const classSectionUpdateSchema = classSectionSchema.extend({
  id: z.string().min(1, "Section ID is required"),
});

export const classTeacherSchema = z.object({
  classId: z.string({
    required_error: "Class ID is required",
  }),
  sectionId: z.string().optional().nullable(), // Optional: if null, teacher is assigned to all sections
  teacherId: z.string({
    required_error: "Teacher ID is required",
  }),
  isClassHead: z.boolean().default(false),
});

export const classTeacherUpdateSchema = classTeacherSchema.extend({
  id: z.string().min(1, "Class Teacher ID is required"),
});

export const classRoomSchema = z.object({
  name: z.string().min(2, "Room name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  description: z.string().optional(),
});

export const classRoomUpdateSchema = classRoomSchema.extend({
  id: z.string().min(1, "Room ID is required"),
});

export const studentEnrollmentSchema = z.object({
  studentId: z.string({
    required_error: "Student is required",
  }),
  classId: z.string({
    required_error: "Class ID is required",
  }),
  sectionId: z.string({
    required_error: "Section is required",
  }),
  rollNumber: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED"], {
    required_error: "Status is required",
  }).default("ACTIVE"),
});

export const studentEnrollmentUpdateSchema = studentEnrollmentSchema.extend({
  id: z.string().min(1, "Enrollment ID is required"),
});

export type ClassFormValues = z.infer<typeof classSchema>;
export type ClassUpdateFormValues = z.infer<typeof classUpdateSchema>;
export type ClassSectionFormValues = z.infer<typeof classSectionSchema>;
export type ClassSectionUpdateFormValues = z.infer<typeof classSectionUpdateSchema>;
export type ClassTeacherFormValues = z.infer<typeof classTeacherSchema>;
export type ClassTeacherUpdateFormValues = z.infer<typeof classTeacherUpdateSchema>;
export type ClassRoomFormValues = z.infer<typeof classRoomSchema>;
export type ClassRoomUpdateFormValues = z.infer<typeof classRoomUpdateSchema>;
export type StudentEnrollmentFormValues = z.infer<typeof studentEnrollmentSchema>;
export type StudentEnrollmentUpdateFormValues = z.infer<typeof studentEnrollmentUpdateSchema>;
