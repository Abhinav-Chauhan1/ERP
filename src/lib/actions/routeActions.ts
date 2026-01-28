"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { routeSchema, routeUpdateSchema, studentRouteSchema, type RouteFormValues, type RouteUpdateFormValues, type StudentRouteFormValues } from "@/lib/schemas/route-schemas";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get all routes with pagination and filters
export async function getRoutes(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleId?: string;
}) {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const { schoolId } = await requireSchoolAccess();
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    // Search filter
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { vehicle: { registrationNo: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    // Status filter
    if (params?.status) {
      where.status = params.status;
    }

    // Vehicle filter
    if (params?.vehicleId) {
      where.vehicleId = params.vehicleId;
    }

    const [routes, total] = await Promise.all([
      db.route.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: {
            include: {
              driver: true,
            },
          },
          stops: {
            orderBy: { sequence: "asc" },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
      }),
      db.route.count({ where }),
    ]);

    return {
      routes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw new Error("Failed to fetch routes");
  }
}

// Get a single route by ID
export async function getRouteById(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    const route = await db.route.findUnique({
      where: { id, schoolId },
      include: {
        vehicle: {
          include: {
            driver: true,
          },
        },
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
          },
        },
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    return route;
  } catch (error) {
    console.error("Error fetching route:", error);
    throw new Error("Failed to fetch route");
  }
}

// Create a new route
export async function createRoute(data: RouteFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Validate input
    const validated = routeSchema.parse(data);

    // Check if vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: validated.vehicleId, schoolId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate stop sequences are unique and sequential
    const sequences = validated.stops.map((stop) => stop.sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new Error("Stop sequences must be unique");
    }

    // Create route with stops
    const route = await db.route.create({
      data: {
        schoolId,
        name: validated.name,
        vehicleId: validated.vehicleId,
        fee: validated.fee,
        status: validated.status,
        stops: {
          create: validated.stops.map((stop) => ({
            stopName: stop.stopName,
            arrivalTime: stop.arrivalTime,
            sequence: stop.sequence,
          })),
        },
      },
      include: {
        vehicle: {
          include: {
            driver: true,
          },
        },
        stops: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    revalidatePath("/admin/transport/routes");
    return { success: true, route };
  } catch (error) {
    console.error("Error creating route:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create route" };
  }
}

// Update a route
export async function updateRoute(id: string, data: RouteUpdateFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Validate input
    const validated = routeUpdateSchema.parse(data);

    // Check if route exists
    const existing = await db.route.findUnique({
      where: { id, schoolId },
      include: {
        stops: true,
      },
    });

    if (!existing) {
      throw new Error("Route not found");
    }

    // If vehicle is being updated, check if it exists
    if (validated.vehicleId) {
      const vehicle = await db.vehicle.findUnique({
        where: { id: validated.vehicleId, schoolId },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }
    }

    // If stops are being updated, validate sequences
    if (validated.stops) {
      const sequences = validated.stops.map((stop) => stop.sequence);
      const uniqueSequences = new Set(sequences);
      if (sequences.length !== uniqueSequences.size) {
        throw new Error("Stop sequences must be unique");
      }
    }

    // Update route
    const route = await db.route.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.vehicleId && { vehicleId: validated.vehicleId }),
        ...(validated.fee !== undefined && { fee: validated.fee }),
        ...(validated.status && { status: validated.status }),
        ...(validated.stops && {
          stops: {
            // Delete existing stops and create new ones
            deleteMany: {},
            create: validated.stops.map((stop) => ({
              stopName: stop.stopName,
              arrivalTime: stop.arrivalTime,
              sequence: stop.sequence,
            })),
          },
        }),
      },
      include: {
        vehicle: {
          include: {
            driver: true,
          },
        },
        stops: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    revalidatePath("/admin/transport/routes");
    revalidatePath(`/admin/transport/routes/${id}`);
    return { success: true, route };
  } catch (error) {
    console.error("Error updating route:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update route" };
  }
}

// Delete a route
export async function deleteRoute(id: string) {
  try {
    // Check if route exists
    const { schoolId } = await requireSchoolAccess();
    // Check if route exists
    const route = await db.route.findUnique({
      where: { id, schoolId },
      include: {
        students: true,
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    // Check if route has assigned students
    if (route.students.length > 0) {
      throw new Error(
        "Cannot delete route with assigned students. Please unassign students first."
      );
    }

    // Delete route (stops will be cascade deleted)
    await db.route.delete({
      where: { id, schoolId },
    });

    revalidatePath("/admin/transport/routes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting route:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete route" };
  }
}

// Get route statistics
export async function getRouteStats() {
  try {
    const { schoolId } = await requireSchoolAccess();
    const [total, active, inactive, totalStudents] = await Promise.all([
      db.route.count({ where: { schoolId } }),
      db.route.count({ where: { status: "ACTIVE", schoolId } }),
      db.route.count({ where: { status: "INACTIVE", schoolId } }),
      db.studentRoute.count({ where: { route: { schoolId } } }),
    ]);

    return {
      total,
      active,
      inactive,
      totalStudents,
    };
  } catch (error) {
    console.error("Error fetching route stats:", error);
    throw new Error("Failed to fetch route statistics");
  }
}

// Get available vehicles for route assignment (vehicles not assigned to active routes)
export async function getAvailableVehicles() {
  try {
    const { schoolId } = await requireSchoolAccess();
    const vehicles = await db.vehicle.findMany({
      where: {
        schoolId,
        status: "ACTIVE",
      },
      include: {
        driver: true,
        routes: {
          where: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: { registrationNo: "asc" },
    });

    return vehicles;
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    throw new Error("Failed to fetch available vehicles");
  }
}

// Student-Route Assignment Actions

// Assign a student to a route
export async function assignStudentToRoute(data: StudentRouteFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Validate input
    const validated = studentRouteSchema.parse(data);

    // Check if route exists and belongs to school
    const route = await db.route.findUnique({
      where: { id: validated.routeId, schoolId },
      include: {
        vehicle: true,
        students: true,
        stops: true,
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    // Check if student exists and belongs to school
    const student = await db.student.findUnique({
      where: { id: validated.studentId, schoolId },
      include: {
        user: true,
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Check if student is already assigned to this route
    const existingAssignment = await db.studentRoute.findUnique({
      where: {
        studentId_routeId: {
          studentId: validated.studentId,
          routeId: validated.routeId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error("Student is already assigned to this route");
    }

    // Check if vehicle has capacity
    if (route.students.length >= route.vehicle.capacity) {
      throw new Error(
        `Route is at full capacity (${route.vehicle.capacity} students)`
      );
    }

    // Validate that pickup and drop stops exist in the route
    const stopNames = route.stops.map((stop) => stop.stopName);
    if (!stopNames.includes(validated.pickupStop)) {
      throw new Error("Pickup stop does not exist in this route");
    }
    if (!stopNames.includes(validated.dropStop)) {
      throw new Error("Drop stop does not exist in this route");
    }

    // Create the assignment
    const assignment = await db.studentRoute.create({
      data: {
        studentId: validated.studentId,
        routeId: validated.routeId,
        pickupStop: validated.pickupStop,
        dropStop: validated.dropStop,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        route: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    revalidatePath("/admin/transport/routes");
    revalidatePath(`/admin/transport/routes/${validated.routeId}`);
    return { success: true, assignment };
  } catch (error) {
    console.error("Error assigning student to route:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to assign student to route" };
  }
}

// Unassign a student from a route
export async function unassignStudentFromRoute(studentRouteId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Check if assignment exists and route belongs to school (indirect check via student or route)
    // Best to fetch assignment then verify school
    const assignment = await db.studentRoute.findUnique({
      where: { id: studentRouteId },
      include: { route: true }
    });

    if (!assignment || assignment.route.schoolId !== schoolId) {
      throw new Error("Student route assignment not found or access denied");
    }

    if (!assignment) {
      throw new Error("Student route assignment not found");
    }

    // Delete the assignment
    await db.studentRoute.delete({
      where: { id: studentRouteId },
    });

    revalidatePath("/admin/transport/routes");
    revalidatePath(`/admin/transport/routes/${assignment.routeId}`);
    return { success: true };
  } catch (error) {
    console.error("Error unassigning student from route:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to unassign student from route" };
  }
}

// Update student route assignment (change pickup/drop stops)
export async function updateStudentRouteAssignment(
  studentRouteId: string,
  data: { pickupStop?: string; dropStop?: string }
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Check if assignment exists
    const assignment = await db.studentRoute.findUnique({
      where: { id: studentRouteId },
      include: {
        route: {
          include: {
            stops: true,
          },
        },
      },
    });

    if (!assignment || assignment.route.schoolId !== schoolId) {
      throw new Error("Student route assignment not found or access denied");
    }

    if (!assignment) {
      throw new Error("Student route assignment not found");
    }

    // Validate stops if provided
    const stopNames = assignment.route.stops.map((stop) => stop.stopName);
    if (data.pickupStop && !stopNames.includes(data.pickupStop)) {
      throw new Error("Pickup stop does not exist in this route");
    }
    if (data.dropStop && !stopNames.includes(data.dropStop)) {
      throw new Error("Drop stop does not exist in this route");
    }

    // Update the assignment
    const updated = await db.studentRoute.update({
      where: { id: studentRouteId },
      data: {
        ...(data.pickupStop && { pickupStop: data.pickupStop }),
        ...(data.dropStop && { dropStop: data.dropStop }),
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        route: true,
      },
    });

    revalidatePath("/admin/transport/routes");
    revalidatePath(`/admin/transport/routes/${assignment.routeId}`);
    return { success: true, assignment: updated };
  } catch (error) {
    console.error("Error updating student route assignment:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update assignment" };
  }
}

// Get students available for route assignment (not already assigned to this route)
export async function getAvailableStudentsForRoute(routeId: string, search?: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    // Check if route belongs to school
    const route = await db.route.findUnique({ where: { id: routeId, schoolId } });
    if (!route) throw new Error("Route not found or access denied");

    // Get students already assigned to this route
    const assignedStudents = await db.studentRoute.findMany({
      where: { routeId },
      select: { studentId: true },
    });

    const assignedStudentIds = assignedStudents.map((sr) => sr.studentId);

    // Build where clause
    const where: any = {
      schoolId,
      id: {
        notIn: assignedStudentIds,
      },
    };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Get available students
    const students = await db.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            class: {
              select: {
                name: true,
              },
            },
            section: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
      take: 50, // Limit results for performance
    });

    return students;
  } catch (error) {
    console.error("Error fetching available students:", error);
    throw new Error("Failed to fetch available students");
  }
}

// Calculate transport fee for a student based on route
export async function calculateTransportFee(routeId: string) {
  try {
    const route = await db.route.findUnique({
      where: { id: routeId },
      select: { fee: true },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    // For now, return the route fee directly
    // In the future, this could be enhanced to calculate based on distance
    return { success: true, fee: route.fee };
  } catch (error) {
    console.error("Error calculating transport fee:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to calculate transport fee" };
  }
}
