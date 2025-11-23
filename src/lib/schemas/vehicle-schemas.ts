import { z } from "zod";

// Validation schemas
export const vehicleSchema = z.object({
  registrationNo: z.string().min(1, "Registration number is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  capacity: z.number().int().positive("Capacity must be a positive number"),
  driverId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("ACTIVE"),
});

export const vehicleUpdateSchema = vehicleSchema.partial();

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
export type VehicleUpdateFormValues = z.infer<typeof vehicleUpdateSchema>;
