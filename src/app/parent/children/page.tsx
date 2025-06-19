import { redirect } from "next/navigation";

// This is a simple redirect page that sends users to the children overview
export default function ParentChildrenPage() {
  redirect("/parent/children/overview");
}
