import * as z from "zod";

export const roomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters"),
  building: z.string().min(1, "Building name is required"),
  floor: z.string().min(1, "Floor is required"),
  type: z.string().min(1, "Room type is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(500, "Capacity must not exceed 500"),
  features: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
});

export const roomUpdateSchema = roomSchema.extend({
  id: z.string().min(1, "Room ID is required"),
});

export type RoomFormValues = z.infer<typeof roomSchema>;
export type RoomUpdateFormValues = z.infer<typeof roomUpdateSchema>;
