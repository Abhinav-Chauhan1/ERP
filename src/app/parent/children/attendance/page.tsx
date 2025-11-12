import { redirect } from "next/navigation";

export default function ChildrenAttendanceRedirect() {
  redirect("/parent/attendance");
}
