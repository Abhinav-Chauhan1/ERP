import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function AlumniLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission(PERMISSIONS.READ_ALUMNI);
    return <>{children}</>;
}
