
import { db } from "@/lib/db";
import { HostelType, RoomType, AllocationStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

async function main() {
    console.log("Starting Hostel Module Verification...");

    // 1. Setup: Create Dummy Student
    console.log("Creating Dummy Student...");
    let user = await db.user.findFirst({ where: { email: "hostel.student@test.com" } });
    if (!user) {
        user = await db.user.create({
            data: {
                firstName: "Hostel",
                lastName: "Student",
                email: "hostel.student@test.com",
                password: "password123",
                role: "STUDENT",
            },
        });
    }

    let student = await db.student.findUnique({ where: { userId: user.id } });
    if (!student) {
        // We need a valid Class to enroll.
        console.log("Setting up Academic environment...");

        // Create/Find Academic Year
        let year = await db.academicYear.findFirst({ where: { name: "2025-2026-HOSTEL-TEST" } });
        if (!year) {
            year = await db.academicYear.create({
                data: {
                    name: "2025-2026-HOSTEL-TEST",
                    startDate: new Date("2025-04-01"),
                    endDate: new Date("2026-03-31")
                }
            });
        }

        // Create/Find Class
        let cls = await db.class.findFirst({ where: { name: "Hostel Class" } });
        if (!cls) {
            // NOTE: 'capacity' field does not exist on Class in this schema.
            cls = await db.class.create({
                data: {
                    name: "Hostel Class",
                    academicYearId: year.id
                }
            });
        }

        console.log("Creating Student with Class Enrollment...");
        student = await db.student.create({
            data: {
                userId: user.id,
                admissionId: "H-2025-001",
                admissionDate: new Date(),
                dateOfBirth: new Date("2010-01-01"),
                gender: "Male"
            }
        });

        // Create Enrollment
        await db.classEnrollment.create({
            data: {
                studentId: student.id,
                classId: cls.id,
                academicYearId: year.id,
                rollNumber: "101"
            }
        });
    }

    // 2. Create Hostel
    console.log("Creating Hostel...");
    const hostel = await db.hostel.create({
        data: {
            name: "Verification Boys Hostel",
            capacity: 100,
            type: HostelType.BOYS,
            address: "Campus North Wing"
        }
    });
    console.log("Hostel Created:", hostel.id);

    // 3. Create Room
    console.log("Creating Room...");
    const room = await db.hostelRoom.create({
        data: {
            hostelId: hostel.id,
            roomNumber: "101",
            floor: 1,
            roomType: RoomType.DOUBLE,
            capacity: 2,
            monthlyFee: 5000,
            currentOccupancy: 0,
            status: "AVAILABLE"
        }
    });
    console.log("Room Created:", room.id);

    // 4. Allocate Room
    console.log("Allocating Room...");
    const allocation = await db.hostelRoomAllocation.create({
        data: {
            roomId: room.id,
            studentId: student.id,
            bedNumber: "A",
            status: AllocationStatus.ACTIVE,
            allocatedDate: new Date()
        }
    });

    // Update occupancy
    await db.hostelRoom.update({
        where: { id: room.id },
        data: { currentOccupancy: { increment: 1 } }
    });
    console.log("Room Allocated:", allocation.id);

    // 5. Generate Fee
    console.log("Generating Fee...");
    const fee = await db.hostelFeePayment.create({
        data: {
            allocationId: allocation.id,
            month: 1,
            year: 2026,
            roomFee: 5000,
            messFee: 3000,
            totalAmount: 8000,
            balance: 8000,
            dueDate: new Date("2026-01-10")
        }
    });
    console.log("Fee Generated:", fee.id);

    // 6. Record Payment
    console.log("Recording Payment...");
    await db.hostelFeePayment.update({
        where: { id: fee.id },
        data: {
            paidAmount: 8000,
            balance: 0,
            status: PaymentStatus.COMPLETED,
            paymentDate: new Date(),
            paymentMethod: PaymentMethod.CASH
        }
    });
    console.log("Payment Recorded. Balance: 0");

    // 7. Vacate
    console.log("Vacating Room...");
    await db.hostelRoomAllocation.update({
        where: { id: allocation.id },
        data: {
            status: AllocationStatus.VACATED,
            vacatedDate: new Date()
        }
    });
    await db.hostelRoom.update({
        where: { id: room.id },
        data: { currentOccupancy: { decrement: 1 } }
    });
    console.log("Vacated.");

    // Cleanup
    console.log("Cleaning up...");
    await db.hostel.delete({ where: { id: hostel.id } }); // Cascades to rooms
    // await db.student.delete({ where: { id: student.id } }); // Optional

    console.log("✅ Hostel Verification SUCCESS");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
