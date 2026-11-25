"use client";

import { useActionState } from "react";
import { createPortal } from "react-dom";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

export interface DeleteActionState {
  error: string | null;
}

export type DeleteRecordsAction = (
  previousState: DeleteActionState,
  formData: FormData,
) => Promise<DeleteActionState>;

const initialState: DeleteActionState = { error: null };

interface DeleteRecordsFormProps {
  action: DeleteRecordsAction;
  ids: readonly string[];
  label: string;
  confirmation: string;
  disabled?: boolean;
}

/** Submits one or more selected records after an explicit destructive confirmation. */
export function DeleteRecordsForm({ action, ids, label, confirmation, disabled = false }: DeleteRecordsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (ids.length === 0) {
    return null;
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
    >
      {ids.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
      <Button
        type="submit"
        disabled={pending || disabled}
        variant="outlined"
        color="error"
        size="small"
        startIcon={<DeleteOutlinedIcon />}
      >
        {pending ? "Deleting…" : label}
      </Button>
      {state.error ? <Alert severity="error" sx={{ mt: 1 }}>{state.error}</Alert> : null}
    </form>
  );
}

/** Places a bulk-delete action into a list page's persistent header action area. */
export function HeaderDeleteRecordsForm({ targetId, ...props }: DeleteRecordsFormProps & { targetId: string }) {
  const target = typeof document === "undefined" ? null : document.getElementById(targetId);
  return target ? createPortal(<DeleteRecordsForm {...props} />, target) : null;
}
