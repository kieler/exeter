import Container from "@mui/material/Container";
import type { ReactNode } from "react";
import { DeleteRecordsForm } from "@/components/delete-records-form";
import { getEventCountPerType } from "@/lib/events";
import { formatScalarMetric, totalSessionLength } from "@/lib/metrics";
import { sessionRepository } from "@/lib/sessions";
import { notFound } from "next/navigation";
import { deleteSessions } from "../../actions";
import { SessionDetailTabs } from "../_components/SessionDetailTabs";
import { SessionHeader } from "../_components/SessionHeader";

interface SessionDetailLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

/** Supplies the shared identity header and navigation for session-detail views. */
export default async function SessionDetailLayout({ children, params }: SessionDetailLayoutProps) {
  const { id } = await params;
  const session = await sessionRepository.getSession(id);
  if (!session) notFound();

  const [sessionLength, eventTypes] = await Promise.all([
    totalSessionLength(session.id),
    getEventCountPerType(session.id),
  ]);
  const eventCount = eventTypes.reduce((total, eventType) => total + eventType.count, 0);

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <SessionHeader
        sessionId={session.id}
        externalSessionId={session.externalSessionId}
        startedAt={session.createdAt}
        lastUpdatedAt={session.lastReceivedAt}
        client={session.client}
        sessionLength={formatScalarMetric(sessionLength)}
        batchCount={session.batchCount}
        eventCount={eventCount}
        stimulus={session.stimulus}
        participant={session.participant}
        action={<DeleteRecordsForm action={deleteSessions} ids={[session.id]} label="Delete session" confirmation="Delete this session and all of its recorded batches and events?" />}
      />
      <SessionDetailTabs sessionId={session.id} />
      {children}
    </Container>
  );
}
