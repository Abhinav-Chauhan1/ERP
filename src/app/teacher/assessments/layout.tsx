import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function AssessmentsLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_EXAM, PERMISSIONS.READ_ASSIGNMENT]);
    return <>{children}</>;
}
