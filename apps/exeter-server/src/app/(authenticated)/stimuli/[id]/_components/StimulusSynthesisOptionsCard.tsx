"use client";

import type { JsonObject, JsonValue } from "@/lib/klighd/replay";
import { Card } from "@/components/card";
import { FormFeedback } from "@/components/form-feedback";
import { initialFormActionState } from "@/lib/form/action-state";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { loadStimulusSynthesisOptions, updateStimulusSynthesisOptions } from "../../actions";

interface StimulusSynthesisOptionsCardProps {
  stimulusId: string;
  disabled: boolean;
}

type SynthesisOption = JsonObject & {
  id: string;
  name: string;
  type: number;
  currentValue: JsonValue;
};

const OPTION_CHECK = 0;
const OPTION_CHOICE = 1;
const OPTION_RANGE = 2;
const OPTION_TEXT = 3;
const OPTION_SEPARATOR = 4;
const OPTION_CATEGORY = 5;

/** Fetches and edits synthesis options offered by the language server for this model. */
export function StimulusSynthesisOptionsCard({
  stimulusId,
  disabled,
}: StimulusSynthesisOptionsCardProps) {
  const [state, action, pending] = useActionState(updateStimulusSynthesisOptions, initialFormActionState);
  const [options, setOptions] = useState<SynthesisOption[] | null>(null);
  const [values, setValues] = useState<Record<string, JsonValue>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setOptions(null);
    void loadStimulusSynthesisOptions(stimulusId)
      .then((available) => {
        if (cancelled) return;
        const resolved = available
          .filter(isSynthesisOption)
          .map((option) => ({ ...option }));
        setOptions(resolved);
        setValues(Object.fromEntries(resolved.map(({ id, currentValue }) => [id, currentValue])));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Synthesis options could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [stimulusId]);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  const hasChanges = options !== null && JSON.stringify(values)
    !== JSON.stringify(Object.fromEntries(options.map(({ id, currentValue }) => [id, currentValue])));

  function setValue(id: string, value: JsonValue): void {
    setValues((current) => ({ ...current, [id]: value }));
  }

  return (
    <Card
      title="Synthesis options"
      titleId="stimulus-synthesis-options-heading"
      description="Options provided by the language server for this model. Saving regenerates the diagram snapshot."
      headingLevel="h2"
    >
      {loading ? (
        <Stack direction="row" spacing={1.5} role="status" sx={{ alignItems: "center" }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading synthesis options…</Typography>
        </Stack>
      ) : loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : options ? (
        <Box component="form" action={action}>
          <input type="hidden" name="stimulusId" value={stimulusId} />
          <input type="hidden" name="synthesisOptions" value={JSON.stringify(values)} />
          <Stack spacing={2}>
            {options.length === 0 ? (
              <Typography variant="body2" color="text.secondary">The language server did not provide synthesis options.</Typography>
            ) : (
              <SynthesisOptions options={options} values={values} onChange={setValue} />
            )}
            {disabled ? <Typography variant="body2" color="text.secondary">Synthesis options are locked because this stimulus already has recorded sessions.</Typography> : null}
            <FormFeedback state={state} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" disabled={disabled || pending || !hasChanges || options.length === 0} variant="contained" size="small">
                {pending ? "Simulating diagram…" : "Save synthesis options"}
              </Button>
            </Box>
          </Stack>
        </Box>
      ) : null}
    </Card>
  );
}

function SynthesisOptions({
  options,
  values,
  categoryId,
  onChange,
}: {
  options: readonly SynthesisOption[];
  values: Readonly<Record<string, JsonValue>>;
  categoryId?: string;
  onChange: (id: string, value: JsonValue) => void;
}) {
  return options
    .filter((option) => categoryFor(option) === categoryId)
    .map((option) => {
      const value = values[option.id] ?? option.currentValue;
      if (option.type === OPTION_SEPARATOR) return <Typography key={option.id} variant="subtitle2">{option.name}</Typography>;

      if (option.type === OPTION_CATEGORY) {
        return (
          <Box
            key={option.id}
            component="details"
            open={Boolean(value)}
            onToggle={(event) => onChange(option.id, event.currentTarget.open)}
            sx={{ borderLeft: 2, borderColor: "divider", pl: 2 }}
          >
            <Box component="summary" sx={{ cursor: "pointer", fontWeight: "medium" }}>{option.name}</Box>
            {typeof option.description === "string" ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{option.description}</Typography> : null}
            <Stack spacing={2} sx={{ mt: 2 }}>
              <SynthesisOptions options={options} values={values} categoryId={option.id} onChange={onChange} />
            </Stack>
          </Box>
        );
      }

      if (option.type === OPTION_CHECK) {
        return (
          <FormControlLabel
            key={option.id}
            control={<Checkbox checked={Boolean(value)} onChange={(event) => onChange(option.id, event.target.checked)} />}
            label={<OptionLabel option={option} />}
          />
        );
      }

      if (option.type === OPTION_CHOICE) {
        const choices = Array.isArray(option.values) ? option.values : [];
        return (
          <TextField
            key={option.id}
            select
            label={option.name}
            value={String(value ?? "")}
            helperText={typeof option.description === "string" ? option.description : undefined}
            onChange={(event) => onChange(option.id, choices.find((choice) => String(choice) === event.target.value) ?? event.target.value)}
            fullWidth
          >
            {choices.map((choice, index) => <MenuItem key={`${option.id}-${index}`} value={String(choice)}>{String(choice)}</MenuItem>)}
          </TextField>
        );
      }

      if (option.type === OPTION_RANGE) {
        const range = isObject(option.range) ? option.range : {};
        return (
          <TextField
            key={option.id}
            label={option.name}
            type="number"
            value={value ?? ""}
            helperText={typeof option.description === "string" ? option.description : undefined}
            slotProps={{
              htmlInput: {
                min: typeof range.first === "number" ? Math.min(range.first, Number(range.second ?? range.first)) : undefined,
                max: typeof range.second === "number" ? Math.max(Number(range.first ?? range.second), range.second) : undefined,
                step: typeof option.stepSize === "number" ? option.stepSize : undefined,
              },
            }}
            onChange={(event) => onChange(option.id, Number(event.target.value))}
            fullWidth
          />
        );
      }

      if (option.type === OPTION_TEXT) {
        return (
          <TextField
            key={option.id}
            label={option.name}
            value={value ?? ""}
            helperText={typeof option.description === "string" ? option.description : undefined}
            onChange={(event) => onChange(option.id, event.target.value)}
            fullWidth
          />
        );
      }

      return null;
    });
}

function OptionLabel({ option }: { option: SynthesisOption }) {
  return (
    <Box>
      <Typography component="span">{option.name}</Typography>
      {typeof option.description === "string" ? <Typography variant="body2" color="text.secondary">{option.description}</Typography> : null}
    </Box>
  );
}

function categoryFor(option: SynthesisOption): string | undefined {
  return isObject(option.category) && typeof option.category.id === "string" ? option.category.id : undefined;
}

function isSynthesisOption(option: JsonObject): option is SynthesisOption {
  return typeof option.id === "string"
    && typeof option.name === "string"
    && typeof option.type === "number";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
