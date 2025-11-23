"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { driverSchema, driverUpdateSchema, type DriverFormValues, type DriverUpdateFormValues } from "@/lib/schemas/driver-schemas";

// Get all drivers with pagination and filters
export async function getDrivers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
        { licenseNo: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [drivers, total] = await Promise.all([
      db.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicles: {
            include: {
              routes: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      }),
      db.driver.count({ where }),
    ]);

    return {
      drivers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw new Error("Failed to fetch drivers");
  }
}

// Get a single driver by ID
export async function getDriverById(id: string) {
  try {
    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        vehicles: {
          include: {
            routes: {
              include: {
                stops: {
                  orderBy: { sequence: "asc" },
                },
                _count: {
                  select: {
                    students: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    return driver;
  } catch (error) {
    console.error("Error fetching driver:", error);
    throw new Error("Failed to fetch driver");
  }
}

// Create a new driver
export async function createDriver(data: DriverFormValues) {
  try {
    // Validate input
    const validated = driverSchema.parse(data);

    // Check if license number already exists
    const existing = await db.driver.findUnique({
      where: { licenseNo: validated.licenseNo },
    });

    if (existing) {
      throw new Error("A driver with this license number already exists");
    }

    // Create driver
    const driver = await db.driver.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        licenseNo: validated.licenseNo,
      },
    });

    revalidatePath("/admin/transport/drivers");
    return { success: true, driver };
  } catch (error) {
    console.error("Error creating driver:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create driver" };
  }
}

// Update a driver
export async function updateDriver(id: string, data: DriverUpdateFormValues) {
  try {
    // Validate input
    const validated = driverUpdateSchema.parse(data);

    // Check if driver exists
    const existing = await db.driver.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Driver not found");
    }

    // If license number is being updated, check for duplicates
    if (validated.licenseNo && validated.licenseNo !== existing.licenseNo) {
      const duplicate = await db.driver.findUnique({
        where: { licenseNo: validated.licenseNo },
      });

      if (duplicate) {
        throw new Error("A driver with this license number already exists");
      }
    }

    // Update driver
    const driver = await db.driver.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phone && { phone: validated.phone }),
        ...(validated.licenseNo && { licenseNo: validated.licenseNo }),
      },
    });

    revalidatePath("/admin/transport/drivers");
    revalidatePath(`/admin/transport/drivers/${id}`);
    return { success: true, driver };
  } catch (error) {
    console.error("Error updating driver:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update driver" };
  }
}

// Delete a driver
export async function deleteDriver(id: string) {
  try {
    // Check if driver exists
    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        vehicles: true,
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    // Check if driver is assigned to any vehicles
    if (driver.vehicles.length > 0) {
      throw new Error(
        "Cannot delete driver assigned to vehicles. Please unassign the driver first."
      );
    }

    // Delete driver
    await db.driver.delete({
      where: { id },
    });

    revalidatePath("/admin/transport/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting driver:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete driver" };
  }
}

// Get available drivers (not assigned to any vehicle)
export async function getAvailableDrivers() {
  try {
    const drivers = await db.driver.findMany({
      where: {
        vehicles: {
          none: {},
        },
      },
      orderBy: { name: "asc" },
    });

    return drivers;
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    throw new Error("Failed to fetch available drivers");
  }
}

// Get all drivers for dropdown (simple list)
export async function getAllDriversSimple() {
  try {
    const drivers = await db.driver.findMany({
      select: {
        id: true,
        name: true,
        licenseNo: true,
      },
      orderBy: { name: "asc" },
    });

    return drivers;
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw new Error("Failed to fetch drivers");
  }
}
