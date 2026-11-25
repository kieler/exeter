"use client";

import { useActionState, useRef } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { uploadModelSource } from "../actions";
import { initialFormActionState } from "@/lib/form/action-state";
import { FormFeedback } from "@/components/form-feedback";

/**
 * Uploads the source file belonging to a model.
 */
export function ModelSourceUploadForm({ modelId, disabled }: { modelId: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(uploadModelSource, initialFormActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack component="form" ref={formRef} action={action} direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <input type="hidden" name="modelId" value={modelId} />
      <input
        ref={fileInputRef}
        type="file"
        name="source"
        required
        disabled={pending || disabled}
        style={{ display: "none" }}
        onClick={(event) => {
          event.currentTarget.value = "";
        }}
        onChange={(event) => {
          if (event.currentTarget.files?.length) {
            formRef.current?.requestSubmit();
          }
        }}
      />
      <FormFeedback state={state} />
      <Button
        type="button"
        disabled={pending || disabled}
        title={disabled ? "Source files cannot be changed while a stimulus uses this model." : undefined}
        variant="outlined"
        size="small"
        startIcon={<UploadFileOutlinedIcon />}
        onClick={() => fileInputRef.current?.click()}
      >
        {pending ? "Uploading…" : "Upload File"}
      </Button>
    </Stack>
  );
}
