import * as z from "zod";

export const subjectFormSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters"),
  code: z.string().min(3, "Subject code must be at least 3 characters"),
  departmentId: z.string({
    required_error: "Please select a department",
  }),
  description: z.string().optional(),
  classIds: z.array(z.string()).min(1, "Please select at least one class"),
});

export const updateSubjectSchema = subjectFormSchema.extend({
  id: z.string().min(1, "Subject ID is required"),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;
export type UpdateSubjectFormValues = z.infer<typeof updateSubjectSchema>;
