import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function FinanceLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requirePermission([PERMISSIONS.READ_FEE, PERMISSIONS.READ_PAYMENT]);
    return <>{children}</>;
}
