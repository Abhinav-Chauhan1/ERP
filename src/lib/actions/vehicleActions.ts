"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { vehicleSchema, vehicleUpdateSchema, type VehicleFormValues, type VehicleUpdateFormValues } from "@/lib/schemas/vehicle-schemas";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/utils/permissions";

// Get all vehicles with pagination and filters
export async function getVehicles(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleType?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (params?.search) {
      where.OR = [
        { registrationNo: { contains: params.search, mode: "insensitive" } },
        { vehicleType: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (params?.status) {
      where.status = params.status;
    }

    // Vehicle type filter
    if (params?.vehicleType) {
      where.vehicleType = params.vehicleType;
    }

    const [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          driver: true,
          routes: {
            include: {
              _count: {
                select: {
                  students: true,
                  stops: true,
                },
              },
            },
          },
        },
      }),
      db.vehicle.count({ where }),
    ]);

    return {
      vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw new Error("Failed to fetch vehicles");
  }
}

// Get a single vehicle by ID
export async function getVehicleById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
        routes: {
          include: {
            stops: {
              orderBy: { sequence: "asc" },
            },
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            _count: {
              select: {
                students: true,
                stops: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    return vehicle;
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw new Error("Failed to fetch vehicle");
  }
}

// Create a new vehicle
export async function createVehicle(data: VehicleFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "VEHICLE", "CREATE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };
    // Validate input
    const validated = vehicleSchema.parse(data);

    // Check if registration number already exists
    const existing = await db.vehicle.findUnique({
      where: { registrationNo: validated.registrationNo },
    });

    if (existing) {
      throw new Error("A vehicle with this registration number already exists");
    }

    // Create vehicle
    const vehicle = await db.vehicle.create({
      data: {
        registrationNo: validated.registrationNo,
        vehicleType: validated.vehicleType,
        capacity: validated.capacity,
        driverId: validated.driverId || null,
        status: validated.status,
      },
      include: {
        driver: true,
      },
    });

    revalidatePath("/admin/transport/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create vehicle" };
  }
}

// Update a vehicle
export async function updateVehicle(id: string, data: VehicleUpdateFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "VEHICLE", "UPDATE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };
    // Validate input
    const validated = vehicleUpdateSchema.parse(data);

    // Check if vehicle exists
    const existing = await db.vehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Vehicle not found");
    }

    // If registration number is being updated, check for duplicates
    if (validated.registrationNo && validated.registrationNo !== existing.registrationNo) {
      const duplicate = await db.vehicle.findUnique({
        where: { registrationNo: validated.registrationNo },
      });

      if (duplicate) {
        throw new Error("A vehicle with this registration number already exists");
      }
    }

    // Update vehicle
    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        ...(validated.registrationNo && { registrationNo: validated.registrationNo }),
        ...(validated.vehicleType && { vehicleType: validated.vehicleType }),
        ...(validated.capacity !== undefined && { capacity: validated.capacity }),
        ...(validated.driverId !== undefined && { driverId: validated.driverId }),
        ...(validated.status && { status: validated.status }),
      },
      include: {
        driver: true,
      },
    });

    revalidatePath("/admin/transport/vehicles");
    revalidatePath(`/admin/transport/vehicles/${id}`);
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update vehicle" };
  }
}

// Delete a vehicle
export async function deleteVehicle(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "VEHICLE", "DELETE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };
    // Check if vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        routes: true,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Check if vehicle has active routes
    const activeRoutes = vehicle.routes.filter((route) => route.status === "ACTIVE");
    if (activeRoutes.length > 0) {
      throw new Error(
        "Cannot delete vehicle with active routes. Please deactivate or reassign routes first."
      );
    }

    // Delete vehicle
    await db.vehicle.delete({
      where: { id },
    });

    revalidatePath("/admin/transport/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete vehicle" };
  }
}

// Assign driver to vehicle
export async function assignDriverToVehicle(vehicleId: string, driverId: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const hasPerm = await hasPermission(session.user.id, "VEHICLE", "UPDATE");
    if (!hasPerm) return { success: false, error: "Insufficient permissions" };
    // Check if vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // If assigning a driver, check if driver exists
    if (driverId) {
      const driver = await db.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        throw new Error("Driver not found");
      }
    }

    // Update vehicle with driver
    const updatedVehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: { driverId },
      include: {
        driver: true,
      },
    });

    revalidatePath("/admin/transport/vehicles");
    revalidatePath(`/admin/transport/vehicles/${vehicleId}`);
    return { success: true, vehicle: updatedVehicle };
  } catch (error) {
    console.error("Error assigning driver to vehicle:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to assign driver to vehicle" };
  }
}

// Get vehicle statistics
export async function getVehicleStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    const [total, active, inactive, maintenance] = await Promise.all([
      db.vehicle.count(),
      db.vehicle.count({ where: { status: "ACTIVE" } }),
      db.vehicle.count({ where: { status: "INACTIVE" } }),
      db.vehicle.count({ where: { status: "MAINTENANCE" } }),
    ]);

    return {
      total,
      active,
      inactive,
      maintenance,
    };
  } catch (error) {
    console.error("Error fetching vehicle stats:", error);
    throw new Error("Failed to fetch vehicle statistics");
  }
}
