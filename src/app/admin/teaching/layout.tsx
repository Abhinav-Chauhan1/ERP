import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function TeachingLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_SUBJECT, PERMISSIONS.READ_CLASS]);
    return <>{children}</>;
}
