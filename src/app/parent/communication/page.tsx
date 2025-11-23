export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function CommunicationPage() {
  redirect("/parent/communication/messages");
}
