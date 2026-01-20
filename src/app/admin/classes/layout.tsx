import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function ClassesLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission(PERMISSIONS.READ_CLASS);
    return <>{children}</>;
}
