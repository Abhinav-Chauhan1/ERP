import { z } from "zod";

// Validation schemas
export const routeStopSchema = z.object({
  stopName: z.string().min(1, "Stop name is required"),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  sequence: z.number().int().positive("Sequence must be a positive number"),
});

export const routeSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  fee: z.number().positive("Fee must be a positive number"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  stops: z.array(routeStopSchema).min(1, "At least one stop is required"),
});

export const routeUpdateSchema = z.object({
  name: z.string().min(1, "Route name is required").optional(),
  vehicleId: z.string().min(1, "Vehicle is required").optional(),
  fee: z.number().positive("Fee must be a positive number").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  stops: z.array(routeStopSchema).min(1, "At least one stop is required").optional(),
});

export type RouteStopFormValues = z.infer<typeof routeStopSchema>;
export type RouteFormValues = z.infer<typeof routeSchema>;
export type RouteUpdateFormValues = z.infer<typeof routeUpdateSchema>;

// Student-Route Assignment Schema
export const studentRouteSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  routeId: z.string().min(1, "Route is required"),
  pickupStop: z.string().min(1, "Pickup stop is required"),
  dropStop: z.string().min(1, "Drop stop is required"),
});

export type StudentRouteFormValues = z.infer<typeof studentRouteSchema>;
