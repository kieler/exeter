"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { saveModelSource } from "../actions";
import { initialFormActionState } from "@/lib/form/action-state";
import { FormFeedback } from "@/components/form-feedback";
import { Card } from "@/components/card";
import { ModelSourceUploadForm } from "./ModelSourceUploadForm";

interface ModelSourceEditorProps {
  modelId: string;
  source: string | null;
  fileName?: string;
  editable: boolean;
  emptyMessage: string;
}

/**
 * Renders a model's source workspace and its upload and save controls.
 */
export function ModelSourceEditor(props: ModelSourceEditorProps) {
  return <ModelSourceEditorContents key={`${props.modelId}:${props.source}`} {...props} />;
}

function ModelSourceEditorContents({ modelId, source, fileName, editable, emptyMessage }: ModelSourceEditorProps) {
  const [state, setState] = useState(initialFormActionState);
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(source ?? "");
  const [savedText, setSavedText] = useState(source ?? "");
  const formId = `model-source-form-${modelId}`;

  function save(formData: FormData): void {
    startTransition(async () => {
      const nextState = await saveModelSource(state, formData);
      setState(nextState);
      if (nextState.success) {
        setSavedText(text);
      }
    });
  }

  const hasChanges = source !== null && text !== savedText;

  return (
    <Card
      title="Source"
      description={fileName}
      headingLevel="h2"
      action={(
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ModelSourceUploadForm modelId={modelId} disabled={!editable || pending} />
          {editable && hasChanges ? (
            <Button
              type="submit"
              form={formId}
              disabled={pending}
              variant="contained"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          ) : null}
        </Stack>
      )}
      sx={{ minWidth: 0 }}
      contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
    >
      {source === null ? (
        <Box sx={{ display: "flex", height: 320, alignItems: "center", justifyContent: "center", bgcolor: "action.hover", p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <Box id={formId} component="form" action={save} sx={{ display: "flex", flexDirection: "column", height: 320, bgcolor: "grey.900" }}>
          <input type="hidden" name="modelId" value={modelId} />
          <TextField
            name="text"
            value={text}
            spellCheck={false}
            disabled={pending}
            label="Model source"
            multiline
            variant="filled"
            onChange={(event) => setText(event.target.value)}
            slotProps={{ input: { readOnly: !editable } }}
            sx={{
              flex: 1,
              "& .MuiInputBase-root": {
                height: "100%",
                alignItems: "flex-start",
                backgroundColor: "transparent",
                color: "common.white",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              },
              "& .MuiInputBase-root:hover": { backgroundColor: "rgba(255, 255, 255, 0.04)" },
              "& .MuiInputBase-root.Mui-focused": { backgroundColor: "rgba(255, 255, 255, 0.06)" },
              "& .MuiInputBase-input": { color: "common.white" },
              "& .MuiInputLabel-root": { color: "grey.400" },
              "& .MuiInputLabel-root.Mui-focused": { color: "grey.300" },
            }}
          />
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", px: 2, py: 1 }}>
            {editable ? (
              <FormFeedback state={state} />
            ) : (
              <Typography variant="body2" color="text.secondary">Source is locked because a stimulus uses this model.</Typography>
            )}
          </Stack>
        </Box>
      )}
    </Card>
  );
}
