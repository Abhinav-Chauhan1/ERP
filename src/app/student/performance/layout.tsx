import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function PerformanceLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission(PERMISSIONS.READ_RESULT);
    return <>{children}</>;
}
