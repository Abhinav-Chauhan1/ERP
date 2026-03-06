import { prisma, faker, log } from './helpers';

export async function seedHostel(schoolId: string, studentIds: string[]) {
    log('🏠', 'Creating hostel data...');
    const hostelIds: string[] = [];
    const hostelRoomIds: string[] = [];
    const allocationIds: string[] = [];

    for (const h of [{ name: 'Boys Hostel - Aryabhata', type: 'BOYS' as const, cap: 100 }, { name: 'Girls Hostel - Kalpana', type: 'GIRLS' as const, cap: 80 }]) {
        const hostel = await prisma.hostel.create({
            data: { schoolId, name: h.name, address: 'DPS Campus, Vasant Kunj', capacity: h.cap, wardenName: faker.person.fullName(), wardenPhone: `+91-${faker.string.numeric(10)}`, type: h.type, status: 'ACTIVE' },
        });
        hostelIds.push(hostel.id);

        for (let r = 1; r <= 10; r++) {
            const room = await prisma.hostelRoom.create({
                data: { schoolId, hostelId: hostel.id, roomNumber: `${h.type[0]}${String(r).padStart(2, '0')}`, floor: Math.ceil(r / 5), roomType: r <= 2 ? 'SINGLE' : r <= 5 ? 'DOUBLE' : 'SHARED', capacity: r <= 2 ? 1 : r <= 5 ? 2 : 4, currentOccupancy: r <= 2 ? 1 : r <= 5 ? 2 : 3, amenities: 'Bed, Cupboard, Study Table, Fan, WiFi', status: 'OCCUPIED', monthlyFee: r <= 2 ? 8000 : r <= 5 ? 5000 : 3500 },
            });
            hostelRoomIds.push(room.id);
        }
    }

    // Allocations for 8 students
    for (let i = 0; i < 8; i++) {
        const a = await prisma.hostelRoomAllocation.create({
            data: { schoolId, roomId: hostelRoomIds[i % hostelRoomIds.length], studentId: studentIds[i], bedNumber: `${i + 1}`, allocatedDate: new Date('2024-04-01'), status: 'ACTIVE' },
        });
        allocationIds.push(a.id);

        // Hostel fee payments for 3 months
        for (let m = 4; m <= 6; m++) {
            const total = 5000;
            await prisma.hostelFeePayment.create({
                data: { schoolId, allocationId: a.id, month: m, year: 2024, roomFee: 3500, messFee: 1200, otherCharges: 300, totalAmount: total, paidAmount: total, balance: 0, paymentDate: new Date(`2024-${String(m).padStart(2, '0')}-05`), paymentMethod: 'BANK_TRANSFER', status: 'COMPLETED', dueDate: new Date(`2024-${String(m).padStart(2, '0')}-01`) },
            });
        }
    }

    // Visitors
    for (let i = 0; i < 5; i++) {
        await prisma.hostelVisitor.create({
            data: { schoolId, studentId: studentIds[i], visitorName: faker.person.fullName(), visitorPhone: `+91-${faker.string.numeric(10)}`, visitorRelation: faker.helpers.arrayElement(['Father', 'Mother', 'Uncle', 'Guardian']), purpose: faker.helpers.arrayElement(['Routine Visit', 'Birthday', 'Health Check', 'Parent-Teacher Meeting']), checkInTime: faker.date.recent({ days: 30 }), checkOutTime: faker.date.recent({ days: 25 }), idProofType: 'Aadhaar', idProofNumber: faker.string.numeric(12) },
        });
    }

    // Complaints
    for (let i = 0; i < 5; i++) {
        await prisma.hostelComplaint.create({
            data: { schoolId, hostelId: hostelIds[i % 2], studentId: studentIds[i], category: faker.helpers.arrayElement(['ROOM_MAINTENANCE', 'MESS_FOOD', 'CLEANLINESS', 'ELECTRICITY', 'WATER_SUPPLY'] as const), subject: faker.lorem.words(4), description: faker.lorem.sentence(), priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH'] as const), status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'RESOLVED'] as const) },
        });
    }

    return { hostelIds, hostelRoomIds, allocationIds };
}
