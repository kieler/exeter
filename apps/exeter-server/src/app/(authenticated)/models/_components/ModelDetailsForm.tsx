"use client";

import type { ModelDetail } from "@/lib/models";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useState, useTransition } from "react";
import { updateModel } from "../actions";
import { initialFormActionState } from "@/lib/form/action-state";
import { FormFeedback } from "@/components/form-feedback";
import { ModelMetadataFields } from "./ModelCreateForm";

/**
 * Edits the metadata fields of an existing diagram model.
 */
export function ModelDetailsForm({ model }: { model: ModelDetail }) {
  return <ModelDetailsFormContents key={model.id} model={model} />;
}

function ModelDetailsFormContents({ model }: { model: ModelDetail }) {
  const [state, setState] = useState(initialFormActionState);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(model.name);
  const [description, setDescription] = useState(model.description);
  const [savedDetails, setSavedDetails] = useState({
    name: model.name,
    description: model.description,
  });
  function save(formData: FormData): void {
    startTransition(async () => {
      const nextState = await updateModel(state, formData);
      setState(nextState);
      if (nextState.success) {
        setName((value) => value.trim());
        setDescription((value) => value.trim());
        setSavedDetails({ name: name.trim(), description: description.trim() });
      }
    });
  }

  const hasChanges = name !== savedDetails.name || description !== savedDetails.description;

  return (
    <Box component="form" action={save} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <input type="hidden" name="modelId" value={model.id} />
      <Stack spacing={3}>
        <ModelMetadataFields
          name={name}
          description={description}
          onNameChange={setName}
          onDescriptionChange={setDescription}
        />
      </Stack>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, mt: "auto", pt: 3 }}>
        <FormFeedback state={state} sx={{ mr: "auto" }} />
        <Button
          type="submit"
          disabled={pending || !hasChanges}
          variant="contained"
        >
          {pending ? "Saving…" : "Save details"}
        </Button>
      </Box>
    </Box>
  );
}
