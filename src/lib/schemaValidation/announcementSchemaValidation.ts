import { z } from "zod";

// Base Announcement Schema (without refinement)
const baseAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  targetAudience: z
    .array(z.enum(["STUDENT", "TEACHER", "PARENT", "ADMIN"]))
    .min(1, "At least one target audience is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
  attachments: z.string().optional().nullable(),
});

// Announcement Schema with refinement
export const announcementSchema = baseAnnouncementSchema.refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

// Announcement Update Schema
export const announcementUpdateSchema = baseAnnouncementSchema.extend({
  id: z.string(),
}).refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type AnnouncementUpdateFormValues = z.infer<typeof announcementUpdateSchema>;

// Announcement Filter Schema
export const announcementFilterSchema = z.object({
  isActive: z.boolean().optional(),
  targetAudience: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type AnnouncementFilterValues = z.infer<typeof announcementFilterSchema>;
