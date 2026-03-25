export const dynamic = "force-dynamic";

import { getEventsPageData } from "@/lib/actions/eventActions";
import { AdminEventsClient } from "./events-client";

export default async function EventsPage() {
  const data = await getEventsPageData();

  return (
    <AdminEventsClient
      initialEvents={data.success ? data.events : []}
      initialUpcomingEvents={data.success ? data.upcomingEvents : []}
      initialTotal={data.success ? data.total : 0}
      initialPage={1}
      pageSize={data.success ? (data as any).pageSize ?? 20 : 20}
    />
  );
}
