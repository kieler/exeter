"use client";

import { FormFeedback } from "@/components/form-feedback";
import { initialFormActionState } from "@/lib/form/action-state";
import type { SurveyDetail } from "@/lib/surveys";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState, useState } from "react";
import { createSurvey, updateSurvey } from "../actions";

export function SurveyCreateForm() {
  const [state, action, pending] = useActionState(createSurvey, initialFormActionState);
  return <SurveyFieldsForm action={action} pending={pending} state={state} submitLabel="Create survey" />;
}

export function SurveyDetailsForm({ survey }: { survey: SurveyDetail }) {
  const [state, action, pending] = useActionState(updateSurvey, initialFormActionState);
  return <SurveyFieldsForm action={action} pending={pending} state={state} submitLabel="Save details" survey={survey} />;
}

function SurveyFieldsForm({ action, pending, state, submitLabel, survey }: {
  action: (payload: FormData) => void;
  pending: boolean;
  state: typeof initialFormActionState;
  submitLabel: string;
  survey?: SurveyDetail;
}) {
  const [name, setName] = useState(survey?.name ?? "");
  const [description, setDescription] = useState(survey?.description ?? "");
  return (
    <Box component="form" action={action} sx={{ maxWidth: "42rem" }}>
      {survey ? <input type="hidden" name="surveyId" value={survey.id} /> : null}
      <Stack spacing={3}>
        <TextField name="name" label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
        <TextField name="description" label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={4} fullWidth />
        <Button type="submit" disabled={pending} variant="contained" sx={{ alignSelf: "flex-start" }}>{pending ? "Saving…" : submitLabel}</Button>
        <FormFeedback state={state} />
      </Stack>
    </Box>
  );
}
