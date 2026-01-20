import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function StudentsLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission(PERMISSIONS.READ_STUDENT);
    return <>{children}</>;
}
