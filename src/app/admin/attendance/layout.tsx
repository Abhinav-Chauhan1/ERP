import { AttendanceNavigation } from "./navigation";

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <AttendanceNavigation />
      {children}
    </div>
  );
}
