export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getEvent, getEventParticipants } from "@/lib/actions/eventActions";
import { AdminEventDetailClient } from "./event-detail-client";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch event + participants in parallel — single auth round-trip each
  const [eventResult, participantsResult] = await Promise.all([
    getEvent(id),
    getEventParticipants(id),
  ]);

  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  return (
    <AdminEventDetailClient
      event={eventResult.data}
      initialParticipants={participantsResult.success ? participantsResult.data : []}
    />
  );
}
