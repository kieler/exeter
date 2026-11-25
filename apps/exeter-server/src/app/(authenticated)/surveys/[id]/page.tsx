import { Card } from "@/components/card";
import { DetailPage } from "@/components/detail-page";
import { DeleteRecordsForm } from "@/components/delete-records-form";
import { formatDateTime } from "@/lib/format-date-time";
import { participantRepository } from "@/lib/participants";
import { stimulusRepository } from "@/lib/stimuli";
import { surveyRepository } from "@/lib/surveys";
import NextLink from "@/components/next-link";
import { PATH_NEW_STIMULUS } from "@/routes";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParticipantTable } from "../../participants/_components/ParticipantTable";
import { StimulusTable } from "../../stimuli/_components/StimulusTable";
import { deleteSurveys } from "../actions";
import { SurveyDetailsForm } from "../_components/SurveyForm";

export const metadata: Metadata = { title: "Survey" };

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await surveyRepository.getSurvey(id);
  if (!survey) notFound();
  const [stimuli, participants] = await Promise.all([
    stimulusRepository.listStimuli(survey.id),
    participantRepository.listParticipants(survey.id),
  ]);
  const canDelete = survey.stimulusCount === 0 && survey.participantCount === 0;
  return (
    <DetailPage
      title={survey.name}
      metadata={[
        { label: "Survey ID", value: <Box component="span" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>{survey.id}</Box> },
        { label: "Created", value: formatDateTime(survey.createdAt, "detail") },
        { label: "Last updated", value: survey.updatedAt ? formatDateTime(survey.updatedAt, "detail") : "—" },
      ]}
      action={<DeleteRecordsForm action={deleteSurveys} ids={[survey.id]} label="Delete survey" confirmation={`Delete survey “${survey.name}”?`} disabled={!canDelete} />}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Card title="Survey details" headingLevel="h2"><SurveyDetailsForm survey={survey} /></Card>
        <Card
          title="Stimuli"
          description={`${survey.stimulusCount} configured ${survey.stimulusCount === 1 ? "stimulus" : "stimuli"}.`}
          headingLevel="h2"
          action={<Button component={NextLink} href={`${PATH_NEW_STIMULUS}?surveyId=${encodeURIComponent(survey.id)}`} size="small">New stimulus</Button>}
          contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
        ><StimulusTable stimuli={stimuli} /></Card>
        <Card title="Participants" description={`${survey.participantCount} participant${survey.participantCount === 1 ? "" : "s"}.`} headingLevel="h2" contentSx={{ p: 0, "&:last-child": { pb: 0 } }}><ParticipantTable participants={participants} /></Card>
      </Box>
    </DetailPage>
  );
}
