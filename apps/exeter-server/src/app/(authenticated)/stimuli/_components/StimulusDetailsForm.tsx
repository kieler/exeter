"use client";

import type { StimulusDetail } from "@/lib/stimuli";
import type { SourceBackedModel } from "@/lib/models";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStimulus } from "../actions";
import { initialFormActionState } from "@/lib/form/action-state";
import { FormFeedback } from "@/components/form-feedback";
import { StimulusFields } from "./StimulusCreateForm";

interface StimulusDetailsFormProps {
  stimulus: StimulusDetail;
  models: readonly SourceBackedModel[];
}

/**
 * Edits stimulus metadata and its model until collection has started.
 */
export function StimulusDetailsForm({ stimulus, models }: StimulusDetailsFormProps) {
  return <StimulusDetailsFormContents key={stimulus.id} stimulus={stimulus} models={models} />;
}

function StimulusDetailsFormContents({ stimulus, models }: StimulusDetailsFormProps) {
  const [state, setState] = useState(initialFormActionState);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(stimulus.name);
  const [description, setDescription] = useState(stimulus.description);
  const [modelId, setModelId] = useState(stimulus.model.id);
  const [savedValues, setSavedValues] = useState({
    name: stimulus.name,
    description: stimulus.description,
    modelId: stimulus.model.id,
  });
  const modelDisabled = stimulus.sessionCount > 0;
  const router = useRouter();

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const nextState = await updateStimulus(state, formData);
      setState(nextState);
      if (nextState.success) {
        const savedName = name.trim();
        const savedDescription = description.trim();
        setName(savedName);
        setDescription(savedDescription);
        setSavedValues({ name: savedName, description: savedDescription, modelId });
        router.refresh();
      }
    });
  }

  const hasChanges = name !== savedValues.name
    || description !== savedValues.description
    || modelId !== savedValues.modelId;

  return (
    <Box id="stimulus-details-form" component="form" onSubmit={save} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <input type="hidden" name="stimulusId" value={stimulus.id} />
      <Stack spacing={3}>
        <StimulusFields
          description={description}
          modelDisabled={modelDisabled}
          modelId={modelId}
          models={models}
          name={name}
          onDescriptionChange={setDescription}
          onModelChange={setModelId}
          onNameChange={setName}
        />
        {modelDisabled ? (
          <Typography variant="body2" color="text.secondary">The model is locked because this stimulus already has recorded sessions.</Typography>
        ) : null}
      </Stack>
      <Box sx={{ mt: "auto", pt: 3 }}>
        <FormFeedback state={state} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 3 }}>
        <Button
          type="submit"
          disabled={pending || !hasChanges}
          variant="contained"
          size="small"
        >
          {pending ? "Simulating diagram..." : "Save details"}
        </Button>
      </Box>
    </Box>
  );
}
