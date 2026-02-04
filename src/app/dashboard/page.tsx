import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const role = session.user.role;

    switch (role) {
        case UserRole.SUPER_ADMIN:
            redirect("/super-admin");
        case UserRole.ADMIN:
            redirect("/admin");
        case UserRole.TEACHER:
            redirect("/teacher");
        case UserRole.STUDENT:
            redirect("/student");
        case UserRole.PARENT:
            redirect("/parent");
        default:
            redirect("/login");
    }
}
