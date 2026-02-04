"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Validation schemas
const transportAttendanceSchema = z.object({
  studentRouteId: z.string().min(1, "Student route is required"),
  date: z.date(),
  stopName: z.string().min(1, "Stop name is required"),
  attendanceType: z.enum(["BOARDING", "ALIGHTING"]),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]).default("PRESENT"),
  recordedBy: z.string().optional(),
  remarks: z.string().optional(),
});

const bulkTransportAttendanceSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  date: z.date(),
  stopName: z.string().min(1, "Stop name is required"),
  attendanceType: z.enum(["BOARDING", "ALIGHTING"]),
  attendanceRecords: z.array(
    z.object({
      studentRouteId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
      remarks: z.string().optional(),
    })
  ),
  recordedBy: z.string().optional(),
});

export type TransportAttendanceFormValues = z.infer<typeof transportAttendanceSchema>;
export type BulkTransportAttendanceFormValues = z.infer<typeof bulkTransportAttendanceSchema>;

// Record transport attendance for a single student
export async function recordTransportAttendance(data: TransportAttendanceFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    // Validate input
    const validated = transportAttendanceSchema.parse(data);

    // Check if student route exists
    const studentRoute = await db.studentRoute.findUnique({
      where: { id: validated.studentRouteId },
      include: {
        route: {
          include: {
            stops: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!studentRoute) {
      throw new Error("Student route assignment not found");
    }

    if (studentRoute.route.schoolId !== schoolId) {
      throw new Error("Access denied");
    }

    // Validate that the stop exists in the route
    const stopNames = studentRoute.route.stops.map((stop) => stop.stopName);
    if (!stopNames.includes(validated.stopName)) {
      throw new Error("Stop does not exist in this route");
    }

    // Check if attendance already exists for this combination
    const existing = await db.transportAttendance.findUnique({
      where: {
        studentRouteId_date_stopName_attendanceType: {
          studentRouteId: validated.studentRouteId,
          date: validated.date,
          stopName: validated.stopName,
          attendanceType: validated.attendanceType,
        },
      },
    });

    if (existing) {
      // Update existing attendance
      const updated = await db.transportAttendance.update({
        where: { id: existing.id },
        data: {
          status: validated.status,
          recordedBy: validated.recordedBy,
          remarks: validated.remarks,
          recordedAt: new Date(),
        },
        include: {
          studentRoute: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
              route: true,
            },
          },
        },
      });

      try {
        revalidatePath("/admin/transport/attendance");
      } catch (e) {
        // Ignore revalidation errors in test environment
      }
      return { success: true, attendance: updated };
    }

    // Create new attendance record
    const attendance = await db.transportAttendance.create({
      data: {
        studentRouteId: validated.studentRouteId,
        date: validated.date,
        stopName: validated.stopName,
        attendanceType: validated.attendanceType,
        status: validated.status,
        recordedBy: validated.recordedBy,
        remarks: validated.remarks,
        schoolId,
      },
      include: {
        studentRoute: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            route: true,
          },
        },
      },
    });

    try {
      revalidatePath("/admin/transport/attendance");
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    return { success: true, attendance };
  } catch (error) {
    console.error("Error recording transport attendance:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to record transport attendance" };
  }
}

// Record bulk transport attendance for multiple students at a stop
export async function recordBulkTransportAttendance(data: BulkTransportAttendanceFormValues) {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    // Validate input
    const validated = bulkTransportAttendanceSchema.parse(data);

    // Check if route exists and belongs to school
    const route = await db.route.findUnique({
      where: { id: validated.routeId, schoolId },
      include: {
        stops: true,
        students: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    // Validate that the stop exists in the route
    const stopNames = route.stops.map((stop: any) => stop.stopName);
    if (!stopNames.includes(validated.stopName)) {
      throw new Error("Stop does not exist in this route");
    }

    // Validate all student route IDs belong to this route
    const routeStudentIds = route.students.map((sr: any) => sr.id);
    const invalidStudentRoutes = validated.attendanceRecords.filter(
      (record) => !routeStudentIds.includes(record.studentRouteId)
    );

    if (invalidStudentRoutes.length > 0) {
      throw new Error("Some students are not assigned to this route");
    }

    // Create or update attendance records
    const results = await Promise.all(
      validated.attendanceRecords.map(async (record) => {
        // Check if attendance already exists
        const existing = await db.transportAttendance.findUnique({
          where: {
            studentRouteId_date_stopName_attendanceType: {
              studentRouteId: record.studentRouteId,
              date: validated.date,
              stopName: validated.stopName,
              attendanceType: validated.attendanceType,
            },
          },
        });

        if (existing) {
          // Update existing
          return db.transportAttendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              recordedBy: validated.recordedBy,
              remarks: record.remarks,
              recordedAt: new Date(),
            },
          });
        }

        // Create new
        return db.transportAttendance.create({
          data: {
            studentRouteId: record.studentRouteId,
            date: validated.date,
            stopName: validated.stopName,
            attendanceType: validated.attendanceType,
            status: record.status,
            recordedBy: validated.recordedBy,
            remarks: record.remarks,
            schoolId,
          },
        });
      })
    );

    try {
      revalidatePath("/admin/transport/attendance");
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Error recording bulk transport attendance:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to record bulk transport attendance" };
  }
}

// Get transport attendance for a specific route and date
export async function getTransportAttendanceByRouteAndDate(
  routeId: string,
  date: Date,
  attendanceType?: "BOARDING" | "ALIGHTING",
  stopName?: string
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    // Get route with students
    const route = await db.route.findUnique({
      where: { id: routeId, schoolId },
      include: {
        stops: {
          orderBy: { sequence: "asc" },
        },
        students: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  where: { status: "ACTIVE" },
                  take: 1,
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
            attendance: {
              where: {
                date: {
                  gte: new Date(date.setHours(0, 0, 0, 0)),
                  lt: new Date(date.setHours(23, 59, 59, 999)),
                },
                ...(attendanceType && { attendanceType }),
                ...(stopName && { stopName }),
              },
            },
          },
        },
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    return route;
  } catch (error) {
    console.error("Error fetching transport attendance:", error);
    throw new Error("Failed to fetch transport attendance");
  }
}

// Get transport attendance for a specific student
export async function getStudentTransportAttendance(
  studentId: string,
  params?: {
    startDate?: Date;
    endDate?: Date;
    attendanceType?: "BOARDING" | "ALIGHTING";
    status?: "PRESENT" | "ABSENT" | "LATE";
  }
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    // Build where clause
    const where: any = {
      studentRoute: {
        studentId,
        route: { schoolId } // Ensure via route
      },
    };

    if (params?.startDate || params?.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = params.startDate;
      }
      if (params.endDate) {
        where.date.lte = params.endDate;
      }
    }

    if (params?.attendanceType) {
      where.attendanceType = params.attendanceType;
    }

    if (params?.status) {
      where.status = params.status;
    }

    const attendance = await db.transportAttendance.findMany({
      where,
      include: {
        studentRoute: {
          include: {
            route: {
              include: {
                vehicle: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return attendance;
  } catch (error) {
    console.error("Error fetching student transport attendance:", error);
    throw new Error("Failed to fetch student transport attendance");
  }
}

// Get transport attendance statistics for a route
export async function getRouteAttendanceStats(
  routeId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    // Verify route belongs to school first
    const route = await db.route.findUnique({ where: { id: routeId, schoolId } });
    if (!route) throw new Error("Route not found or access denied");

    const [totalRecords, presentCount, absentCount, lateCount, boardingCount, alightingCount] =
      await Promise.all([
        db.transportAttendance.count({
          where: {
            studentRoute: {
              routeId,
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        db.transportAttendance.count({
          where: {
            studentRoute: {
              routeId,
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
            status: "PRESENT",
          },
        }),
        db.transportAttendance.count({
          where: {
            studentRoute: {
              routeId,
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
            status: "ABSENT",
          },
        }),
        db.transportAttendance.count({
          where: {
            studentRoute: {
              routeId,
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
            status: "LATE",
          },
        }),
        db.transportAttendance.count({
          where: {
            studentRoute: {
              routeId,
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
            attendanceType: "BOARDING",
          },
        }),
        db.transportAttendance.count({
          where: {
            studentRoute: {
              routeId,
            },
            date: {
              gte: startDate,
              lte: endDate,
            },
            attendanceType: "ALIGHTING",
          },
        }),
      ]);

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      boardingCount,
      alightingCount,
      presentPercentage: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
      absentPercentage: totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0,
      latePercentage: totalRecords > 0 ? (lateCount / totalRecords) * 100 : 0,
    };
  } catch (error) {
    console.error("Error fetching route attendance stats:", error);
    throw new Error("Failed to fetch route attendance statistics");
  }
}

// Delete transport attendance record
export async function deleteTransportAttendance(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    const attendance = await db.transportAttendance.findUnique({
      where: { id },
      include: { studentRoute: { include: { route: true } } }
    });

    if (!attendance || attendance.studentRoute.route.schoolId !== schoolId) {
      throw new Error("Transport attendance record not found or access denied");
    }

    if (!attendance) {
      throw new Error("Transport attendance record not found");
    }

    await db.transportAttendance.delete({
      where: { id },
    });

    try {
      revalidatePath("/admin/transport/attendance");
    } catch (e) {
      // Ignore revalidation errors in test environment
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting transport attendance:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete transport attendance" };
  }
}

// Get today's transport attendance summary for all routes
export async function getTodayTransportAttendanceSummary() {
  try {
    const { schoolId } = await requireSchoolAccess();
    
    if (!schoolId) {
      throw new Error("School access required");
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const routes = await db.route.findMany({
      where: { status: "ACTIVE", schoolId },
      include: {
        vehicle: true,
        students: {
          include: {
            attendance: {
              where: {
                date: {
                  gte: today,
                  lt: tomorrow,
                },
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

    const summary = routes.map((route) => {
      const totalStudents = route._count.students;
      const boardingRecords = route.students.flatMap((sr: any) =>
        sr.attendance.filter((a: any) => a.attendanceType === "BOARDING")
      );
      const alightingRecords = route.students.flatMap((sr: any) =>
        sr.attendance.filter((a: any) => a.attendanceType === "ALIGHTING")
      );

      const boardingPresent = boardingRecords.filter((a: any) => a.status === "PRESENT").length;
      const alightingPresent = alightingRecords.filter((a: any) => a.status === "PRESENT").length;

      return {
        routeId: route.id,
        routeName: route.name,
        vehicleRegistration: route.vehicle.registrationNo,
        totalStudents,
        boardingRecorded: boardingRecords.length,
        boardingPresent,
        alightingRecorded: alightingRecords.length,
        alightingPresent,
      };
    });

    return summary;
  } catch (error) {
    console.error("Error fetching today's transport attendance summary:", error);
    throw new Error("Failed to fetch today's transport attendance summary");
  }
}
