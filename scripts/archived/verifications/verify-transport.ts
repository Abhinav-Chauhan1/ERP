
import { db } from "@/lib/db";

async function main() {
    console.log("Starting Transport Module Verification...");

    // 1. Setup: Create Dummy Student (or reuse)
    console.log("Setting up Student...");
    let user = await db.user.findFirst({ where: { email: "transport.student@test.com" } });
    if (!user) {
        user = await db.user.create({
            data: {
                firstName: "Transport",
                lastName: "Student",
                email: "transport.student@test.com",
                password: "password123",
                role: "STUDENT",
            },
        });
    }

    let student = await db.student.findUnique({ where: { userId: user.id } });
    if (!student) {
        // Basic fallback without full academic setup (simpler checks if constraints allow)
        // Actually, Student creation needs `admissionId` etc. as discovered in Hostel test.
        // Let's rely on finding any student if this one fails validation, or try create with valid new props.
        student = await db.student.create({
            data: {
                userId: user.id,
                admissionId: "T-2025-001",
                admissionDate: new Date(),
                dateOfBirth: new Date("2010-01-01"),
                gender: "Female"
            }
        }).catch(async () => {
            console.log("Student exists or creation failed, finding first available student...");
            return db.student.findFirst();
        });
    }

    if (!student) throw new Error("Could not find or create a student.");

    // 2. Create Driver
    console.log("Creating Driver...");
    const driver = await db.driver.create({
        data: {
            name: "Raju Driver",
            phone: "9876543210",
            licenseNo: "DL-KA-01-2025-001"
        }
    });
    console.log("Driver Created:", driver.id);

    // 3. Create Vehicle
    console.log("Creating Vehicle...");
    const vehicle = await db.vehicle.create({
        data: {
            registrationNo: "KA-01-AB-1234",
            vehicleType: "Bus",
            capacity: 40,
            driverId: driver.id,
            status: "ACTIVE"
        }
    });
    console.log("Vehicle Created:", vehicle.id);

    // 4. Create Route
    console.log("Creating Route...");
    const route = await db.route.create({
        data: {
            name: "Route 1 - North City",
            vehicleId: vehicle.id,
            fee: 2500,
            status: "ACTIVE"
        }
    });
    console.log("Route Created:", route.id);

    // 5. Add Stops
    console.log("Adding Stops...");
    await db.routeStop.createMany({
        data: [
            { routeId: route.id, stopName: "Main Gate", arrivalTime: "07:30", sequence: 1 },
            { routeId: route.id, stopName: "City Center", arrivalTime: "08:00", sequence: 2 },
            { routeId: route.id, stopName: "School", arrivalTime: "08:30", sequence: 3 },
        ]
    });
    console.log("Stops Added.");

    // 6. Assign Student to Route
    console.log("Assigning Student to Route...");
    const assignment = await db.studentRoute.create({
        data: {
            studentId: student.id,
            routeId: route.id,
            pickupStop: "Main Gate",
            dropStop: "School"
        }
    });
    console.log("Student Assigned:", assignment.id);

    // 7. Verify Assignment
    const verify = await db.studentRoute.findUnique({
        where: { id: assignment.id },
        include: { route: true, student: true }
    });

    if (verify && verify.route.fee === 2500) {
        console.log("✅ Verification SUCCESS: Student assigned to route with correct fee.");
    } else {
        console.error("❌ Verification FAILED: Assignment mismatch.");
        process.exit(1);
    }

    // Cleanup
    console.log("Cleaning up...");
    await db.route.delete({ where: { id: route.id } }); // Cascades to stops and student_routes?
    // Checking Cascade rules:
    // RouteStop: onDelete Cascade (Yes)
    // StudentRoute: No cascade specified on Route side in schema snippet? 
    // "students StudentRoute[]"
    // Let's manually delete assignment to be safe.
    await db.studentRoute.deleteMany({ where: { routeId: route.id } });
    await db.route.delete({ where: { id: route.id } });
    await db.vehicle.delete({ where: { id: vehicle.id } });
    await db.driver.delete({ where: { id: driver.id } });
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
