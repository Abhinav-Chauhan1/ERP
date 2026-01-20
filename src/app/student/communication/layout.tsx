import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function CommunicationLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_MESSAGE, PERMISSIONS.READ_ANNOUNCEMENT]);
    return <>{children}</>;
}
