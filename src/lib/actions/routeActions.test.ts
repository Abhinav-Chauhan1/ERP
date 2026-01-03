import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db } from '@/lib/db';
import {
  assignStudentToRoute,
  unassignStudentFromRoute,
  getAvailableStudentsForRoute,
  calculateTransportFee,
} from './routeActions';

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Student-Route Assignment', () => {
  let testRoute: any;
  let testStudent: any;
  let testVehicle: any;
  let testDriver: any;
  let testUser: any;
  let testStudentUser: any;

  beforeAll(async () => {
    // Create test driver
    testDriver = await db.driver.create({
      data: {
        name: 'Test Driver',
        phone: '1234567890',
        licenseNo: 'TEST-LIC-' + Date.now(),
      },
    });

    // Create test vehicle
    testVehicle = await db.vehicle.create({
      data: {
        registrationNo: 'TEST-VEH-' + Date.now(),
        vehicleType: 'Bus',
        capacity: 50,
        status: 'ACTIVE',
        driverId: testDriver.id,
      },
    });

    // Create test route with stops
    testRoute = await db.route.create({
      data: {
        name: 'Test Route ' + Date.now(),
        vehicleId: testVehicle.id,
        fee: 1000,
        status: 'ACTIVE',
        stops: {
          create: [
            { stopName: 'Stop A', arrivalTime: '08:00', sequence: 1 },
            { stopName: 'Stop B', arrivalTime: '08:15', sequence: 2 },
            { stopName: 'Stop C', arrivalTime: '08:30', sequence: 3 },
          ],
        },
      },
      include: {
        stops: true,
      },
    });

    // Create test student user
    testStudentUser = await db.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Student',
        email: 'test.student.' + Date.now() + '@example.com',
        role: 'STUDENT',
      },
    });

    // Create test student
    testStudent = await db.student.create({
      data: {
        userId: testStudentUser.id,
        admissionId: 'TEST-ADM-' + Date.now(),
        admissionDate: new Date(),
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE',
        bloodGroup: 'O+',
        address: 'Test Address',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testStudent) {
      await db.studentRoute.deleteMany({ where: { studentId: testStudent.id } });
      await db.student.delete({ where: { id: testStudent.id } });
    }
    if (testStudentUser) {
      await db.user.delete({ where: { id: testStudentUser.id } });
    }
    if (testRoute) {
      await db.routeStop.deleteMany({ where: { routeId: testRoute.id } });
      await db.route.delete({ where: { id: testRoute.id } });
    }
    if (testVehicle) {
      await db.vehicle.delete({ where: { id: testVehicle.id } });
    }
    if (testDriver) {
      await db.driver.delete({ where: { id: testDriver.id } });
    }
  });

  it('should assign a student to a route successfully', async () => {
    const result = await assignStudentToRoute({
      studentId: testStudent.id,
      routeId: testRoute.id,
      pickupStop: 'Stop A',
      dropStop: 'Stop C',
    });

    expect(result.success).toBe(true);
    expect(result.assignment).toBeDefined();
    expect(result.assignment?.studentId).toBe(testStudent.id);
    expect(result.assignment?.routeId).toBe(testRoute.id);
    expect(result.assignment?.pickupStop).toBe('Stop A');
    expect(result.assignment?.dropStop).toBe('Stop C');
  }, 10000);

  it('should prevent duplicate assignment', async () => {
    // Try to assign the same student again
    const result = await assignStudentToRoute({
      studentId: testStudent.id,
      routeId: testRoute.id,
      pickupStop: 'Stop A',
      dropStop: 'Stop B',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already assigned');
  }, 10000);

  it('should validate that stops exist in the route', async () => {
    // Create another student for this test
    const anotherUser = await db.user.create({
      data: {
        firstName: 'Another',
        lastName: 'Student',
        email: 'another.student.' + Date.now() + '@example.com',
        role: 'STUDENT',
      },
    });

    const anotherStudent = await db.student.create({
      data: {
        userId: anotherUser.id,
        admissionId: 'TEST-ADM-2-' + Date.now(),
        admissionDate: new Date(),
        dateOfBirth: new Date('2010-01-01'),
        gender: 'FEMALE',
        bloodGroup: 'A+',
        address: 'Test Address',
      },
    });

    const result = await assignStudentToRoute({
      studentId: anotherStudent.id,
      routeId: testRoute.id,
      pickupStop: 'Invalid Stop',
      dropStop: 'Stop B',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');

    // Clean up
    await db.student.delete({ where: { id: anotherStudent.id } });
    await db.user.delete({ where: { id: anotherUser.id } });
  });

  it('should get available students for route', async () => {
    const students = await getAvailableStudentsForRoute(testRoute.id);

    // The test student should not be in the list since they're already assigned
    const assignedStudent = students.find((s) => s.id === testStudent.id);
    expect(assignedStudent).toBeUndefined();
  });

  it('should calculate transport fee based on route', async () => {
    const result = await calculateTransportFee(testRoute.id);

    expect(result.success).toBe(true);
    expect(result.fee).toBe(1000);
  });

  it('should unassign a student from route', async () => {
    // Get the assignment
    const assignment = await db.studentRoute.findUnique({
      where: {
        studentId_routeId: {
          studentId: testStudent.id,
          routeId: testRoute.id,
        },
      },
    });

    expect(assignment).toBeDefined();

    // Unassign
    const result = await unassignStudentFromRoute(assignment!.id);

    expect(result.success).toBe(true);

    // Verify it's removed
    const checkAssignment = await db.studentRoute.findUnique({
      where: {
        studentId_routeId: {
          studentId: testStudent.id,
          routeId: testRoute.id,
        },
      },
    });

    expect(checkAssignment).toBeNull();
  });
});
