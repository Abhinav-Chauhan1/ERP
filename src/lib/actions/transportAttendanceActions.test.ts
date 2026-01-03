import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  recordTransportAttendance,
  recordBulkTransportAttendance,
  getTransportAttendanceByRouteAndDate,
  getStudentTransportAttendance,
  getRouteAttendanceStats,
} from "./transportAttendanceActions";

describe("Transport Attendance Actions", () => {
  let testVehicle: any;
  let testDriver: any;
  let testRoute: any;
  let testStudent: any;
  let testUser: any;
  let testStudentRoute: any;

  beforeAll(async () => {
    // Create test data
    testDriver = await db.driver.create({
      data: {
        name: "Test Driver",
        phone: "1234567890",
        licenseNo: `TEST-${Date.now()}`,
      },
    });

    testVehicle = await db.vehicle.create({
      data: {
        registrationNo: `TEST-VEH-${Date.now()}`,
        vehicleType: "Bus",
        capacity: 50,
        driverId: testDriver.id,
        status: "ACTIVE",
      },
    });

    testRoute = await db.route.create({
      data: {
        name: "Test Route",
        vehicleId: testVehicle.id,
        fee: 1000,
        status: "ACTIVE",
        stops: {
          create: [
            { stopName: "Stop A", arrivalTime: "08:00", sequence: 1 },
            { stopName: "Stop B", arrivalTime: "08:15", sequence: 2 },
            { stopName: "Stop C", arrivalTime: "08:30", sequence: 3 },
          ],
        },
      },
    });

    testUser = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "Student",
        role: "STUDENT",
      },
    });

    testStudent = await db.student.create({
      data: {
        userId: testUser.id,
        admissionId: `ADM-${Date.now()}`,
        admissionDate: new Date(),
        dateOfBirth: new Date("2010-01-01"),
        gender: "Male",
      },
    });

    testStudentRoute = await db.studentRoute.create({
      data: {
        studentId: testStudent.id,
        routeId: testRoute.id,
        pickupStop: "Stop A",
        dropStop: "Stop C",
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testStudentRoute) {
      await db.transportAttendance.deleteMany({
        where: { studentRouteId: testStudentRoute.id },
      });
      await db.studentRoute.delete({ where: { id: testStudentRoute.id } });
    }
    if (testStudent) await db.student.delete({ where: { id: testStudent.id } });
    if (testUser) await db.user.delete({ where: { id: testUser.id } });
    if (testRoute) {
      await db.routeStop.deleteMany({ where: { routeId: testRoute.id } });
      await db.route.delete({ where: { id: testRoute.id } });
    }
    if (testVehicle) await db.vehicle.delete({ where: { id: testVehicle.id } });
    if (testDriver) await db.driver.delete({ where: { id: testDriver.id } });
  });

  it("should record transport attendance for a single student", async () => {
    const result = await recordTransportAttendance({
      studentRouteId: testStudentRoute.id,
      date: new Date(),
      stopName: "Stop A",
      attendanceType: "BOARDING",
      status: "PRESENT",
    });

    expect(result.success).toBe(true);
    expect(result.attendance).toBeDefined();
    expect(result.attendance?.status).toBe("PRESENT");
    expect(result.attendance?.attendanceType).toBe("BOARDING");
  });

  it("should record bulk transport attendance", async () => {
    const result = await recordBulkTransportAttendance({
      routeId: testRoute.id,
      date: new Date(),
      stopName: "Stop B",
      attendanceType: "BOARDING",
      attendanceRecords: [
        {
          studentRouteId: testStudentRoute.id,
          status: "PRESENT",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
  });

  it("should get transport attendance by route and date", async () => {
    const today = new Date();
    const route = await getTransportAttendanceByRouteAndDate(
      testRoute.id,
      today,
      "BOARDING",
      "Stop A"
    );

    expect(route).toBeDefined();
    expect(route.id).toBe(testRoute.id);
    expect(route.students).toBeDefined();
  });

  it("should get student transport attendance", async () => {
    const attendance = await getStudentTransportAttendance(testStudent.id);

    expect(Array.isArray(attendance)).toBe(true);
    expect(attendance.length).toBeGreaterThan(0);
  });

  it("should get route attendance statistics", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const stats = await getRouteAttendanceStats(testRoute.id, startDate, endDate);

    expect(stats).toBeDefined();
    expect(stats.totalRecords).toBeGreaterThanOrEqual(0);
    expect(stats.presentCount).toBeGreaterThanOrEqual(0);
    expect(stats.absentCount).toBeGreaterThanOrEqual(0);
    expect(stats.lateCount).toBeGreaterThanOrEqual(0);
  });

  it("should update existing attendance record", async () => {
    const date = new Date();

    // First record
    const result1 = await recordTransportAttendance({
      studentRouteId: testStudentRoute.id,
      date,
      stopName: "Stop C",
      attendanceType: "ALIGHTING",
      status: "PRESENT",
    });

    expect(result1.success).toBe(true);

    // Update the same record
    const result2 = await recordTransportAttendance({
      studentRouteId: testStudentRoute.id,
      date,
      stopName: "Stop C",
      attendanceType: "ALIGHTING",
      status: "LATE",
      remarks: "Traffic delay",
    });

    expect(result2.success).toBe(true);
    expect(result2.attendance?.status).toBe("LATE");
    expect(result2.attendance?.remarks).toBe("Traffic delay");
  });

  it("should reject invalid stop name", async () => {
    const result = await recordTransportAttendance({
      studentRouteId: testStudentRoute.id,
      date: new Date(),
      stopName: "Invalid Stop",
      attendanceType: "BOARDING",
      status: "PRESENT",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Stop does not exist");
  });
});
