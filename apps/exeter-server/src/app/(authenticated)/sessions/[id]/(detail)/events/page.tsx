import { eventRepository } from "@/lib/events";
import type { Metadata } from "next";
import { EventsTable } from "../../events/events-table";

interface SessionEventsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Recorded events",
};

/** Displays every persisted event for this session. */
export default async function SessionEventsPage({ params }: SessionEventsPageProps) {
  const { id } = await params;

  return <EventsTable events={await eventRepository.listEvents(id)} />;
}
