import { Card } from "@/components/card";
import Box from "@mui/material/Box";
import { DetailPage } from "@/components/detail-page";
import { DeleteRecordsForm } from "@/components/delete-records-form";
import { ModelPreview } from "@/components/model-preview";
import { getExeterBaseUrl } from "@/lib/exeter-base-url";
import { stimulusRepository } from "@/lib/stimuli";
import { formatDateTime } from "@/lib/format-date-time";
import { listSourceBackedModels } from "@/lib/models";
import { listDiagramOptions } from "@/lib/klighd/render-options";
import NextLink from "@/components/next-link";
import Link from "@mui/material/Link";
import { getSurveyPath } from "@/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteStimuli } from "../actions";
import { StimulusDetailsForm } from "../_components/StimulusDetailsForm";
import { CopyEmbedCodeButton } from "./_components/CopyEmbedCodeButton";
import { StimulusSessionsTable } from "./_components/StimulusSessionsTable";
import { StimulusDiagramOptionsCard } from "./_components/StimulusDiagramOptionsCard";
import { StimulusSynthesisOptionsCard } from "./_components/StimulusSynthesisOptionsCard";
import { StimulusDetailTabs } from "./_components/StimulusDetailTabs";

interface StimulusDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Stimulus",
};

/**
 * Edits one stimulus and exposes its public embed code and recorded sessions.
 */
export default async function StimulusDetailPage({ params }: StimulusDetailPageProps) {
  const { id } = await params;
  const stimulus = await stimulusRepository.getStimulus(id);
  if (!stimulus) {
    notFound();
  }

  const [models, sessions] = await Promise.all([
    listSourceBackedModels(),
    stimulusRepository.listSessions(stimulus.id),
  ]);
  const diagramOptions = listDiagramOptions();
  const embedUrl = `${getExeterBaseUrl()}/embed/${encodeURIComponent(stimulus.id)}`;
  const participantEmbedUrl = `${embedUrl}?externalParticipantId={SAVEDID}&externalSessionId={QUESTION_CODE}`;
  const embedCode = iframeCode(participantEmbedUrl);
  const pendingEventUploadUrl = `${getExeterBaseUrl()}/embed/upload-pending`;
  const pendingEventUploadEmbedCode = hiddenIframeCode(pendingEventUploadUrl);
  const previewUrl = `/embed/${encodeURIComponent(stimulus.id)}?disableInstrumentation=1&version=${stimulus.updatedAt?.getTime() ?? 0}`;

  return (
    <DetailPage
      title={stimulus.name}
      metadata={[
        {
          label: "Stimulus ID",
          value: (
            <Box component="span" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>
              {stimulus.id}
            </Box>
          ),
        },
        { label: "Survey", value: <Link component={NextLink} href={getSurveyPath(stimulus.survey.id)}>{stimulus.survey.name}</Link> },
        { label: "Created", value: formatDateTime(stimulus.createdAt, "detail") },
        {
          label: "Last updated",
          value: stimulus.updatedAt ? formatDateTime(stimulus.updatedAt, "detail") : "—",
        },
      ]}
      action={
        <DeleteRecordsForm
          action={deleteStimuli}
          ids={[stimulus.id]}
          label="Delete stimulus"
          confirmation={`Delete stimulus “${stimulus.name}”?`}
          disabled={stimulus.sessionCount > 0}
        />
      }
    >
      <StimulusDetailTabs
        overview={(
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 3fr) minmax(0, 4fr)" },
              gap: 3,
            }}
          >
            <Box sx={{ display: "flex", minWidth: 0, flexDirection: "column", gap: 3 }}>
              <Card
                title="Stimulus details"
                titleId="stimulus-details-heading"
                headingLevel="h2"
                sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
                contentSx={{ flex: 1 }}
              >
                <StimulusDetailsForm stimulus={stimulus} models={models} />
              </Card>

              <section aria-labelledby="embed-code-heading">
                <Card
                  title="Embed code"
                  titleId="embed-code-heading"
                  headingLevel="h2"
                  action={<CopyEmbedCodeButton code={embedCode} url={participantEmbedUrl} />}
                  contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
                >
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      overflowX: "auto",
                      bgcolor: "grey.900",
                      color: "common.white",
                      p: 2.5,
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                    }}
                  >
                    <code>{embedCode}</code>
                  </Box>
                </Card>
              </section>

              <section aria-labelledby="pending-event-upload-heading">
                <Card
                  title="Pending-event uploader"
                  titleId="pending-event-upload-heading"
                  description="Embed this on later survey pages to deliver events left by a previous diagram page."
                  headingLevel="h2"
                  action={<CopyEmbedCodeButton code={pendingEventUploadEmbedCode} url={pendingEventUploadUrl} />}
                  contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
                >
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      overflowX: "auto",
                      bgcolor: "grey.900",
                      color: "common.white",
                      p: 2.5,
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                    }}
                  >
                    <code>{pendingEventUploadEmbedCode}</code>
                  </Box>
                </Card>
              </section>
            </Box>

            <ModelPreview
              titleId="stimulus-preview-heading"
              description={stimulus.model.name}
              iframeTitle={`Preview of ${stimulus.name}`}
              previewUrl={previewUrl}
            />
          </Box>
        )}
        diagramOptions={(
          <StimulusDiagramOptionsCard
            stimulusId={stimulus.id}
            initialValues={stimulus.renderOptions}
            options={diagramOptions}
            disabled={stimulus.sessionCount > 0}
          />
        )}
        synthesisOptions={(
          <StimulusSynthesisOptionsCard
            key={stimulus.model.id}
            stimulusId={stimulus.id}
            disabled={stimulus.sessionCount > 0}
          />
        )}
        sessions={(
          <Card
            title="Sessions"
            titleId="stimulus-sessions-heading"
            description={`${stimulus.sessionCount} recorded session${stimulus.sessionCount === 1 ? "" : "s"}.`}
            headingLevel="h2"
            contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
          >
            <StimulusSessionsTable sessions={sessions} />
          </Card>
        )}
      />
    </DetailPage>
  );
}

function iframeCode(embedUrl: string): string {
  return `<iframe src="${embedUrl.replaceAll("&", "&amp;")}" width="100%" height="700"></iframe>`;
}

function hiddenIframeCode(embedUrl: string): string {
  return `<iframe src="${embedUrl}" width="1" height="1" aria-hidden="true" tabindex="-1" style="position:absolute; opacity:0; pointer-events:none;"></iframe>`;
}
