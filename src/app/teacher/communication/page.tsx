export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function TeacherCommunicationPage() {
  redirect("/teacher/communication/messages");
}
