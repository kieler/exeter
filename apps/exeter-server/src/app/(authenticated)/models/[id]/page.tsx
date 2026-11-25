import { Card } from "@/components/card";
import { DetailPage } from "@/components/detail-page";
import { DeleteRecordsForm } from "@/components/delete-records-form";
import { ModelPreview } from "@/components/model-preview";
import { stimulusRepository } from "@/lib/stimuli";
import { formatDateTime } from "@/lib/format-date-time";
import { modelFileStore, modelRepository } from "@/lib/models";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import { deleteModels } from "../actions";
import { ModelDetailsForm } from "../_components/ModelDetailsForm";
import { ModelSourceEditor } from "../_components/ModelSourceEditor";

interface ModelDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Model",
};

/**
 * Edits one model and shows its stored source and embedded diagram preview.
 */
export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params;
  const model = await modelRepository.getModel(id);
  if (!model) {
    notFound();
  }

  const [source, isUsedByStimulus] = await Promise.all([
    modelFileStore.read(model.id),
    stimulusRepository.isModelReferenced(model.id),
  ]);
  const previewParameters = new URLSearchParams({
    version: String(model.updatedAt?.getTime() ?? 0),
  });
  const previewUrl = `/models/${encodeURIComponent(model.id)}/preview?${previewParameters}`;

  return (
    <DetailPage
      title={model.name}
      metadata={[
        { label: "Model ID", value: <Box component="span" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>{model.id}</Box> },
        { label: "Created", value: formatDateTime(model.createdAt, "detail") },
        { label: "Last updated", value: model.updatedAt ? formatDateTime(model.updatedAt, "detail") : "—" },
      ]}
      action={<DeleteRecordsForm action={deleteModels} ids={[model.id]} label="Delete model" confirmation={`Delete model “${model.name}”?`} disabled={isUsedByStimulus} />}
    >

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 3fr) minmax(0, 4fr)" }, gap: 3 }}>
        <Card
          title="Model details"
          titleId="model-details-heading"
          headingLevel="h2"
          sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
          contentSx={{ flex: 1 }}
        >
          <ModelDetailsForm model={model} />
        </Card>

        <ModelSourceEditor
          modelId={model.id}
          source={source?.text ?? null}
          fileName={source?.fileName}
          editable={!isUsedByStimulus}
          emptyMessage={
            isUsedByStimulus
              ? "This model is used by a stimulus, so its source is locked."
              : "Upload a source file to view it here."
          }
        />
      </Box>

      <Box component="section" aria-labelledby="model-preview-heading" sx={{ mt: 5 }}>
        <ModelPreview
          titleId="model-preview-heading"
          description={source?.fileName}
          iframeTitle={`Preview of ${model.name}`}
          previewUrl={source ? previewUrl : undefined}
        />
      </Box>
    </DetailPage>
  );
}
