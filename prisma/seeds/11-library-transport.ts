import { prisma, faker, log } from './helpers';

export async function seedLibrary(schoolId: string, studentIds: string[]) {
    log('📚', 'Creating library data...');
    const categories = ['Science', 'Mathematics', 'Literature', 'History', 'Technology', 'Reference', 'Fiction', 'Biography'];
    const bookIds: string[] = [];
    for (let i = 0; i < 20; i++) {
        const cat = categories[i % categories.length];
        const b = await prisma.book.create({
            data: { schoolId, isbn: `978-${faker.string.numeric(10)}`, title: faker.lorem.words({ min: 2, max: 5 }), author: faker.person.fullName(), publisher: faker.helpers.arrayElement(['NCERT', 'S. Chand', 'Arihant', 'Pearson', 'Oxford', 'Cambridge']), category: cat, quantity: faker.number.int({ min: 5, max: 20 }), available: faker.number.int({ min: 2, max: 15 }), location: `Shelf ${String.fromCharCode(65 + Math.floor(i / 5))}-${(i % 5) + 1}` },
        });
        bookIds.push(b.id);
    }

    // Book Issues
    for (let i = 0; i < 10; i++) {
        const returned = faker.datatype.boolean({ probability: 0.6 });
        await prisma.bookIssue.create({
            data: { schoolId, bookId: bookIds[i % bookIds.length], studentId: studentIds[i % studentIds.length], issueDate: faker.date.between({ from: '2024-05-01', to: '2024-08-01' }), dueDate: faker.date.between({ from: '2024-06-01', to: '2024-09-01' }), returnDate: returned ? faker.date.recent({ days: 30 }) : undefined, status: returned ? 'RETURNED' : faker.helpers.arrayElement(['ISSUED', 'OVERDUE']), fine: returned ? 0 : faker.number.float({ min: 0, max: 50, fractionDigits: 0 }) },
        });
    }

    // Book Reservations
    for (let i = 0; i < 5; i++) {
        await prisma.bookReservation.create({
            data: { schoolId, bookId: bookIds[i + 10], studentId: studentIds[i], reservedAt: new Date(), expiresAt: faker.date.soon({ days: 7 }), status: 'ACTIVE' },
        });
    }

    return { bookIds };
}

export async function seedTransport(schoolId: string, studentIds: string[]) {
    log('🚌', 'Creating transport data...');
    const driverIds: string[] = [];
    const driverNames = ['Ramu Yadav', 'Suresh Kumar', 'Ganesh Singh'];
    for (let i = 0; i < 3; i++) {
        const d = await prisma.driver.create({
            data: { schoolId, name: driverNames[i], phone: `+91-99887766${i}${i}`, licenseNo: `DL-${faker.string.numeric(10)}` },
        });
        driverIds.push(d.id);
    }

    const vehicleData = [
        { reg: 'DL-01-AB-1234', type: 'Bus', capacity: 50 },
        { reg: 'DL-01-CD-5678', type: 'Bus', capacity: 45 },
        { reg: 'DL-01-EF-9012', type: 'Van', capacity: 15 },
    ];
    const vehicleIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const v = await prisma.vehicle.create({
            data: { schoolId, registrationNo: vehicleData[i].reg, vehicleType: vehicleData[i].type, capacity: vehicleData[i].capacity, driverId: driverIds[i], status: 'ACTIVE' },
        });
        vehicleIds.push(v.id);
    }

    const routeData = [
        { name: 'Route 1 - Vasant Kunj to Saket', stops: ['Vasant Kunj B-Block', 'Vasant Kunj C-Block', 'Munirka', 'R.K. Puram', 'Saket Metro'] },
        { name: 'Route 2 - Dwarka to School', stops: ['Dwarka Sec-10', 'Dwarka Sec-7', 'Janakpuri', 'Hari Nagar', 'DPS Vasant Kunj'] },
        { name: 'Route 3 - Greater Kailash', stops: ['GK-1 M Block', 'GK-2 N Block', 'Chirag Delhi', 'Malviya Nagar'] },
    ];
    const routeIds: string[] = [];
    const studentRouteIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const r = await prisma.route.create({
            data: { schoolId, name: routeData[i].name, vehicleId: vehicleIds[i], fee: faker.number.int({ min: 2000, max: 4000 }), status: 'ACTIVE' },
        });
        routeIds.push(r.id);
        for (let s = 0; s < routeData[i].stops.length; s++) {
            await prisma.routeStop.create({ data: { schoolId, routeId: r.id, stopName: routeData[i].stops[s], arrivalTime: `0${7 + Math.floor(s / 2)}:${s % 2 === 0 ? '00' : '30'}`, sequence: s + 1 } });
        }
    }

    // Assign 6 students to routes
    for (let i = 0; i < 6; i++) {
        const rIdx = i % 3;
        const stops = routeData[rIdx].stops;
        const sr = await prisma.studentRoute.create({
            data: { schoolId, studentId: studentIds[i], routeId: routeIds[rIdx], pickupStop: stops[0], dropStop: stops[stops.length - 1] },
        });
        studentRouteIds.push(sr.id);
        // Transport attendance
        for (let d = 1; d <= 5; d++) {
            await prisma.transportAttendance.create({
                data: { schoolId, studentRouteId: sr.id, date: new Date(`2024-08-${String(d).padStart(2, '0')}`), stopName: stops[0], attendanceType: 'BOARDING', status: faker.helpers.weightedArrayElement([{ value: 'PRESENT' as const, weight: 85 }, { value: 'ABSENT' as const, weight: 15 }]) },
            });
        }
    }

    return { routeIds, studentRouteIds };
}
