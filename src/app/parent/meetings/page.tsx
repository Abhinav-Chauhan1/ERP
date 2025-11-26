import { redirect } from "next/navigation";

/**
 * Parent Meetings - Main page redirects to upcoming meetings
 * Requirements: 1.1
 */
export default function ParentMeetingsPage() {
  redirect("/parent/meetings/upcoming");
}
