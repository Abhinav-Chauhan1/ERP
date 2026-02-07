
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
    const email = "superadmin@example.com";
    const password = "SuperAdmin@123";
    const name = "Super Admin";

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`User with email ${email} already exists.`);
        return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            name,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            emailVerified: new Date(),
        },
    });

    console.log("Super admin created successfully:");
    console.log({
        id: user.id,
        email: user.email,
        role: user.role,
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
