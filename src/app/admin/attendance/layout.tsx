import { AttendanceNavigation } from "./navigation";
import { requirePermission, PERMISSIONS } from "@/lib/utils/permissions";
import { ReactNode } from "react";

export default async function AttendanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePermission(PERMISSIONS.READ_ATTENDANCE);
  return (
    <div className="flex flex-col">
      <AttendanceNavigation />
      {children}
    </div>
  );
}
