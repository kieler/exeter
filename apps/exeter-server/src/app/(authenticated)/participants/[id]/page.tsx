import { Card } from "@/components/card";
import Box from "@mui/material/Box";
import { DetailPage } from "@/components/detail-page";
import { DeleteRecordsForm } from "@/components/delete-records-form";
import { participantRepository } from "@/lib/participants";
import { formatDateTime } from "@/lib/format-date-time";
import NextLink from "@/components/next-link";
import Link from "@mui/material/Link";
import { getSurveyPath } from "@/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteParticipants } from "../actions";
import { ParticipantStimuliTable } from "./_components/ParticipantStimuliTable";
import { ParticipantSessionsTable } from "./_components/ParticipantSessionsTable";

interface ParticipantDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Participant",
};

/**
 * Shows the recorded sessions and stimuli associated with one participant.
 */
export default async function ParticipantDetailPage({ params }: ParticipantDetailPageProps) {
  const { id } = await params;
  const participant = await participantRepository.getParticipant(id);
  if (!participant) {
    notFound();
  }

  const [sessions, stimuli] = await Promise.all([
    participantRepository.listSessions(participant.id),
    participantRepository.listStimuli(participant.id),
  ]);

  return (
    <DetailPage
      title="Participant"
      metadata={[
        { label: "Participant ID", value: <Box component="span" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>{participant.id}</Box> },
        { label: "External participant ID", value: participant.externalParticipantId ?? "—" },
        { label: "Survey", value: <Link component={NextLink} href={getSurveyPath(participant.survey.id)}>{participant.survey.name}</Link> },
        { label: "Created", value: formatDateTime(participant.createdAt, "detail") },
      ]}
      action={<DeleteRecordsForm action={deleteParticipants} ids={[participant.id]} label="Delete participant" confirmation="Delete this participant?" disabled={participant.sessionCount > 0} />}
    >

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 3 }}>
        <Card
          title="Sessions"
          description={`${participant.sessionCount} recorded session${participant.sessionCount === 1 ? "" : "s"}.`}
          headingLevel="h2"
          contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
        >
          <ParticipantSessionsTable sessions={sessions} />
        </Card>
        <Card
          title="Stimuli"
          description={`${participant.stimulusCount} linked stimulus${participant.stimulusCount === 1 ? "" : "s"}.`}
          headingLevel="h2"
          contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
        >
          <ParticipantStimuliTable stimuli={stimuli} />
        </Card>
      </Box>
    </DetailPage>
  );
}
