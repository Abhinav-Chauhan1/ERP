import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function TransportLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_VEHICLE, PERMISSIONS.READ_ROUTE]);
    return <>{children}</>;
}
