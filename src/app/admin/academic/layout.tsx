import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function AcademicLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_CLASS, PERMISSIONS.READ_SUBJECT]);
    return <>{children}</>;
}
