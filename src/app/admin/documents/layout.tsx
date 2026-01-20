import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function DocumentsLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_DOCUMENT, PERMISSIONS.READ_CERTIFICATE]);
    return <>{children}</>;
}
