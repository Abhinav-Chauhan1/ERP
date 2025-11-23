import { z } from "zod";

// Validation schemas
export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  licenseNo: z.string().min(1, "License number is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const driverUpdateSchema = driverSchema.partial();

export type DriverFormValues = z.infer<typeof driverSchema>;
export type DriverUpdateFormValues = z.infer<typeof driverUpdateSchema>;
