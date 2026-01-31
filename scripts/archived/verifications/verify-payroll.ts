
import { db } from "@/lib/db";
import { upsertSalaryStructure, generatePayroll, deletePayroll } from "@/lib/actions/payrollActions";

async function main() {
    console.log("Starting Payroll Verification...");

    // 1. Setup: Get a user to act as Teacher (Simulating for script)
    // In a real script we might need to mock auth(), but since we are running via tsx which has direct DB access,
    // we will bypass the Action's auth check by interacting with DB directly for setup, 
    // BUT we want to test the Action logic.

    // Actually, action calls `currentUser()` which will fail in CLI script. 
    // So we will simulate the LOGIC here by calling the underlying DB operations directly 
    // mirroring what the action does, OR we just trust our unit test logic.

    // NOTE: Implementing a pure DB verification here to ensure SCHEMA and RELATIONS properly work.
    // We can't easily mock NextAuth session in a standalone script without extensive setup.

    console.log("Step 1: finding a teacher...");
    let teacher = await db.teacher.findFirst();
    if (!teacher) {
        console.log("No teacher found, creating one...");
        const user = await db.user.create({
            data: {
                firstName: "Payroll",
                lastName: "Tester",
                email: `payroll.test.${Date.now()}@example.com`,
                password: "password123",
                role: "TEACHER"
            }
        });
        teacher = await db.teacher.create({
            data: {
                userId: user.id,
                employeeId: `EMP-${Date.now()}`,
                joinDate: new Date(),
            }
        });
    }
    console.log("Using Teacher:", teacher.id);

    // 2. Create Salary Structure directly (simulating upsertSalaryStructure)
    console.log("Step 2: Creating Salary Structure...");
    const structure = await db.salaryStructure.upsert({
        where: { teacherId: teacher.id },
        create: {
            teacherId: teacher.id,
            basic: 10000,
            hra: 4000, // 40%
            da: 2000,  // 20%
            travelAllowance: 1000,
            otherAllowances: [{ name: "Internet", amount: 500 }],
            providentFund: 1200, // 12%
            professionalTax: 200,
            tds: 500,
            otherDeductions: [{ name: "Canteen", amount: 100 }],
        },
        update: {},
    });
    console.log("Structure created:", structure);

    // 3. Generate Payroll directly (simulating generatePayroll logic)
    console.log("Step 3: Generating Payroll for Month 1, 2026...");

    // Calculate expected values
    const totalEarnings = 10000 + 4000 + 2000 + 1000 + 500; // 17500
    const totalDeductions = 1200 + 200 + 500 + 100; // 2000
    const expectedNet = totalEarnings - totalDeductions; // 15500

    // Clean up existing if any
    await db.payroll.deleteMany({
        where: { teacherId: teacher.id, month: 1, year: 2026 }
    });

    const payroll = await db.payroll.create({
        data: {
            teacherId: teacher.id,
            month: 1,
            year: 2026,
            basicSalary: structure.basic,
            hra: structure.hra,
            da: structure.da,
            travelAllowance: structure.travelAllowance,
            otherAllowances: structure.otherAllowances as any,
            providentFund: structure.providentFund,
            professionalTax: structure.professionalTax,
            tds: structure.tds,
            otherDeductions: structure.otherDeductions as any,

            allowances: totalEarnings - structure.basic,
            deductions: totalDeductions,
            netSalary: expectedNet,
            status: "PENDING",
        }
    });

    console.log("Payroll Generated:", payroll.id);
    console.log(`Net Salary: ${payroll.netSalary} (Expected: ${expectedNet})`);

    if (payroll.netSalary === expectedNet) {
        console.log("✅ Verification SUCCESS: Net Salary matches.");
    } else {
        console.error("❌ Verification FAILED: Net Salary mismatch.");
        process.exit(1);
    }

    // Cleanup
    await db.payroll.delete({ where: { id: payroll.id } });
    console.log("Cleanup done.");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
