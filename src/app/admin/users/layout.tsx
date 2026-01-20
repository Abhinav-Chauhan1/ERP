import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function UsersLayout({
    children,
}: {
    children: ReactNode;
}) {
    // Allow access if user has ANY of the user management permissions
    await requirePermission([
        PERMISSIONS.READ_USER,
        PERMISSIONS.READ_STUDENT,
        PERMISSIONS.READ_TEACHER,
        PERMISSIONS.READ_PARENT
    ]);
    return <>{children}</>;
}
