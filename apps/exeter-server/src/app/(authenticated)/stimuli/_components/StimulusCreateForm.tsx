"use client";

import { Card } from "@/components/card";
import { ModelPreview } from "@/components/model-preview";
import type { SourceBackedModel } from "@/lib/models";
import type { SurveyListItem } from "@/lib/surveys";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useActionState, useState } from "react";
import { createStimulus } from "../actions";
import { initialFormActionState } from "@/lib/form/action-state";
import { FormFeedback } from "@/components/form-feedback";

interface StimulusCreateFormProps {
  models: readonly SourceBackedModel[];
  surveys: readonly SurveyListItem[];
  initialSurveyId?: string;
}

/**
 * Creates a stimulus from metadata and one source-backed model.
 */
export function StimulusCreateForm({ models, surveys, initialSurveyId }: StimulusCreateFormProps) {
  const [state, action, pending] = useActionState(createStimulus, initialFormActionState);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [modelId, setModelId] = useState("");
  const [surveyId, setSurveyId] = useState(() => initialSurveyId && surveys.some((survey) => survey.id === initialSurveyId) ? initialSurveyId : "");
  const hasOptions = models.length > 0 && surveys.length > 0;
  const selectedModel = models.find((model) => model.id === modelId);
  const previewUrl = selectedModel ? `/models/${encodeURIComponent(selectedModel.id)}/preview` : undefined;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 3fr) minmax(0, 4fr)" }, gap: 3 }}>
      <Card
        title="Stimulus details"
        titleId="stimulus-details-heading"
        headingLevel="h2"
        sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
        contentSx={{ flex: 1 }}
      >
        <Box component="form" action={action} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Stack spacing={3}>
            <StimulusFields
              description={description}
              modelId={modelId}
              models={models}
              name={name}
              onDescriptionChange={setDescription}
              onModelChange={setModelId}
              onNameChange={setName}
              surveys={surveys}
              surveyId={surveyId}
              onSurveyChange={setSurveyId}
            />
            {!hasOptions ? (
              <Typography variant="body2" color="text.secondary">Create a survey and upload a model source before creating a stimulus.</Typography>
            ) : null}
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, mt: "auto", pt: 3 }}>
            <FormFeedback state={state} sx={{ mr: "auto" }} />
            <Button
              type="submit"
              disabled={pending || !selectedModel || !surveyId}
              variant="contained"
            >
              {pending ? "Simulating diagram..." : "Create stimulus"}
            </Button>
          </Box>
        </Box>
      </Card>

      <ModelPreview
        titleId="stimulus-model-preview-heading"
        description={selectedModel?.name}
        iframeTitle={selectedModel ? `Preview of ${selectedModel.name}` : "Model preview"}
        previewUrl={previewUrl}
        emptyMessage="Choose a model to enable the preview."
      />
    </Box>
  );
}

export interface StimulusFieldsProps {
  name: string;
  description: string;
  modelId: string;
  models: readonly SourceBackedModel[];
  surveys?: readonly SurveyListItem[];
  surveyId?: string;
  modelDisabled?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSurveyChange?: (value: string) => void;
}

/**
 * Renders the editable fields shared by stimulus forms.
 */
export function StimulusFields({
  name,
  description,
  modelId,
  models,
  surveys,
  surveyId,
  modelDisabled = false,
  onNameChange,
  onDescriptionChange,
  onModelChange,
  onSurveyChange,
}: StimulusFieldsProps) {
  return (
    <>
      <TextField name="name" label="Name" value={name} onChange={(event) => onNameChange(event.target.value)} required fullWidth />
      <TextField name="description" label="Description" value={description} onChange={(event) => onDescriptionChange(event.target.value)} multiline minRows={4} fullWidth />
      {surveys && onSurveyChange ? (
        <TextField select name="surveyId" label="Survey" value={surveyId} required onChange={(event) => onSurveyChange(event.target.value)} fullWidth>
          <MenuItem value="" disabled>Select a survey</MenuItem>
          {surveys.map((survey) => <MenuItem key={survey.id} value={survey.id}>{survey.name}</MenuItem>)}
        </TextField>
      ) : null}
      {modelDisabled ? <input type="hidden" name="modelId" value={modelId} /> : null}
      <TextField
        select
        name={modelDisabled ? undefined : "modelId"}
        label="Model"
        value={modelId}
        required
        disabled={modelDisabled}
        onChange={(event) => onModelChange(event.target.value)}
        fullWidth
      >
        <MenuItem value="" disabled>Select a model</MenuItem>
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id}>{model.name}</MenuItem>
          ))}
      </TextField>
    </>
  );
}
