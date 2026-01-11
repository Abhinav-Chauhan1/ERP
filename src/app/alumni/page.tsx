/**
 * Alumni Portal Root Page
 * 
 * Redirects to the alumni dashboard.
 */

import { redirect } from "next/navigation";

export default function AlumniPage() {
  redirect("/alumni/dashboard");
}
