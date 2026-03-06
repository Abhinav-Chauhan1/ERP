import { prisma, faker, log } from './helpers';

export async function seedFinance(schoolId: string, academicYearId: string, studentIds: string[], classIds: string[], teacherIds: string[]) {
    log('💰', 'Creating finance data...');
    // Fee Types
    const feeTypeData = [
        { name: 'Tuition Fee', amount: 50000, frequency: 'ANNUAL' as const },
        { name: 'Lab Fee', amount: 5000, frequency: 'ANNUAL' as const },
        { name: 'Library Fee', amount: 2000, frequency: 'ANNUAL' as const },
        { name: 'Transport Fee', amount: 3000, frequency: 'MONTHLY' as const },
        { name: 'Activity Fee', amount: 3000, frequency: 'ANNUAL' as const },
        { name: 'Exam Fee', amount: 2000, frequency: 'SEMI_ANNUAL' as const },
    ];
    const feeTypeIds: string[] = [];
    for (const ft of feeTypeData) {
        const f = await prisma.feeType.create({ data: { schoolId, ...ft } });
        feeTypeIds.push(f.id);
    }

    // FeeTypeClassAmount
    for (let ci = 0; ci < classIds.length; ci++) {
        for (let fi = 0; fi < feeTypeIds.length; fi++) {
            await prisma.feeTypeClassAmount.create({ data: { schoolId, feeTypeId: feeTypeIds[fi], classId: classIds[ci], amount: feeTypeData[fi].amount * (1 + ci * 0.1) } });
        }
    }

    // Fee Structure
    const fs = await prisma.feeStructure.create({
        data: { schoolId, name: 'Standard Fee 2024-25', academicYearId, description: 'Standard fee structure', validFrom: new Date('2024-04-01'), validTo: new Date('2025-03-31'), isActive: true },
    });

    for (const ftId of feeTypeIds) {
        await prisma.feeStructureItem.create({ data: { schoolId, feeStructureId: fs.id, feeTypeId: ftId, amount: feeTypeData[feeTypeIds.indexOf(ftId)].amount, dueDate: new Date('2024-06-30') } });
    }

    for (const cId of classIds.slice(0, 2)) {
        await prisma.feeStructureClass.create({ data: { schoolId, feeStructureId: fs.id, classId: cId } });
    }

    // Fee Payments + Receipts
    for (let si = 0; si < 15; si++) {
        const paid = faker.number.int({ min: 30000, max: 65000 });
        const fp = await prisma.feePayment.create({
            data: { schoolId, studentId: studentIds[si], feeStructureId: fs.id, amount: 65000, paidAmount: paid, balance: 65000 - paid, paymentDate: faker.date.between({ from: '2024-04-15', to: '2024-08-30' }), paymentMethod: faker.helpers.arrayElement(['CASH', 'BANK_TRANSFER', 'ONLINE_PAYMENT'] as const), receiptNumber: `REC-2024-${String(si + 1).padStart(4, '0')}`, status: paid >= 65000 ? 'COMPLETED' : 'PARTIAL' },
        });

        const refNum = `PR-2024-${String(si + 1).padStart(4, '0')}`;
        const receipt = await prisma.paymentReceipt.create({
            data: { schoolId, studentId: studentIds[si], feeStructureId: fs.id, amount: paid, paymentDate: fp.paymentDate, paymentMethod: fp.paymentMethod, referenceNumber: refNum, receiptImageUrl: `/receipts/${refNum}.pdf`, receiptPublicId: `receipt_${si}`, status: 'VERIFIED', feePaymentId: fp.id },
        });
        await prisma.receiptNote.create({ data: { schoolId, receiptId: receipt.id, note: 'Verified and approved', authorId: studentIds[0], authorName: 'Admin' } });
    }

    // Budget + Expenses
    const budgetCategories = ['Salaries', 'Infrastructure', 'Academic Resources', 'Sports Equipment', 'Technology'];
    for (const cat of budgetCategories) {
        const b = await prisma.budget.create({
            data: { schoolId, title: `${cat} Budget 2024-25`, academicYearId, category: cat, allocatedAmount: faker.number.int({ min: 200000, max: 2000000 }), startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'Active' },
        });
        for (let i = 0; i < 3; i++) {
            await prisma.expense.create({
                data: { schoolId, title: `${cat} expense ${i + 1}`, description: faker.lorem.sentence(), amount: faker.number.int({ min: 5000, max: 100000 }), date: faker.date.between({ from: '2024-04-01', to: '2024-09-30' }), category: cat, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'COMPLETED', paidTo: faker.person.fullName(), budgetId: b.id },
            });
        }
    }

    // Scholarships
    const scholarships = ['Merit Scholarship', 'Sports Scholarship', 'SC/ST Scholarship', 'EWS Scholarship'];
    for (let i = 0; i < scholarships.length; i++) {
        const s = await prisma.scholarship.create({
            data: { schoolId, name: scholarships[i], description: `${scholarships[i]} for deserving students`, amount: faker.number.int({ min: 10000, max: 50000 }), percentage: faker.number.int({ min: 10, max: 100 }), criteria: 'Academic excellence', fundedBy: faker.helpers.arrayElement(['School Trust', 'Government', 'Corporate CSR']) },
        });
        await prisma.scholarshipRecipient.create({
            data: { schoolId, scholarshipId: s.id, studentId: studentIds[i], awardDate: new Date('2024-04-01'), amount: s.amount, status: 'Active' },
        });
    }

    // Payroll
    for (let ti = 0; ti < teacherIds.length; ti++) {
        for (let m = 4; m <= 8; m++) {
            const basic = faker.number.int({ min: 30000, max: 60000 });
            const net = basic * 1.2;
            await prisma.payroll.create({
                data: { schoolId, teacherId: teacherIds[ti], month: m, year: 2024, basicSalary: basic, hra: basic * 0.1, da: basic * 0.05, travelAllowance: 2000, allowances: basic * 0.15, deductions: basic * 0.1, providentFund: basic * 0.06, professionalTax: 200, netSalary: net, paymentDate: new Date(`2024-${String(m).padStart(2, '0')}-28`), paymentMethod: 'BANK_TRANSFER', status: 'COMPLETED' },
            });
        }
    }

    return { feeStructureId: fs.id, feeTypeIds };
}
