import * as z from "zod";

// Schema for a single period
const periodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Period name is required"),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Start time must be in 24-hour format (HH:MM)",
  }),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "End time must be in 24-hour format (HH:MM)",
  }),
  order: z.number().optional(),
}).refine(
  (data) => {
    const start = data.startTime.split(":").map(Number);
    const end = data.endTime.split(":").map(Number);
    
    // Convert to minutes for easy comparison
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    return endMinutes > startMinutes;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

// Main configuration schema
export const timetableConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Configuration name must be at least 3 characters"),
  daysOfWeek: z.array(
    z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])
  ).min(1, "At least one day must be selected"),
  periods: z.array(periodSchema).min(1, "At least one period must be defined"),
});

export type TimetableConfigFormValues = z.infer<typeof timetableConfigSchema>;
export type PeriodFormValues = z.infer<typeof periodSchema>;
