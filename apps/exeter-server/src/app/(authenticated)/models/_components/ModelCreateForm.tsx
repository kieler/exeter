"use client";

import { createModel } from "../actions";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState, useState } from "react";
import { initialFormActionState } from "@/lib/form/action-state";
import { FormFeedback } from "@/components/form-feedback";

/**
 * Provides the initial metadata form for a new diagram model.
 */
export function ModelCreateForm() {
  const [state, action, pending] = useActionState(createModel, initialFormActionState);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Box component="form" action={action} sx={{ maxWidth: "42rem" }}>
      <Stack spacing={3}>
      <ModelMetadataFields
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
      />
      <Button
        type="submit"
        disabled={pending}
        variant="contained"
        sx={{ alignSelf: "flex-start" }}
      >
        {pending ? "Creating…" : "Create model"}
      </Button>
      <FormFeedback state={state} />
      </Stack>
    </Box>
  );
}

/**
 * Renders the name and description controls shared by model forms.
 */
export function ModelMetadataFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}) {
  return (
    <>
      <TextField name="name" label="Name" value={name} onChange={(event) => onNameChange(event.target.value)} required fullWidth />
      <TextField name="description" label="Description" value={description} onChange={(event) => onDescriptionChange(event.target.value)} multiline minRows={4} fullWidth />
    </>
  );
}
