import Alert from "@mui/material/Alert";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FormActionState } from "@/lib/form/action-state";

/** Displays success or error feedback returned by a form action. */
export function FormFeedback({
  state,
  sx,
}: {
  state: FormActionState;
  sx?: SxProps<Theme>;
}) {
  if (state.error) return <Alert severity="error" sx={sx}>{state.error}</Alert>;
  if (state.success) return <Alert severity="success" sx={sx}>{state.success}</Alert>;
  return null;
}
