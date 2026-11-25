"use client";

import type {
  DiagramOption,
  DiagramOptionValue,
  DiagramRenderOptions,
} from "@/lib/klighd/render-options";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/card";
import { FormFeedback } from "@/components/form-feedback";
import { initialFormActionState } from "@/lib/form/action-state";
import { updateStimulusRenderOptions } from "../../actions";

interface StimulusDiagramOptionsCardProps {
  stimulusId: string;
  initialValues: DiagramRenderOptions;
  options: readonly DiagramOption[];
  disabled: boolean;
}

/**
 * Displays the render options currently defined by the local KLighD client.
 */
export function StimulusDiagramOptionsCard({
  stimulusId,
  initialValues,
  options,
  disabled,
}: StimulusDiagramOptionsCardProps) {
  const [state, action, pending] = useActionState(
    updateStimulusRenderOptions,
    initialFormActionState,
  );
  const [values, setValues] = useState<Record<string, DiagramOptionValue>>(() =>
    valuesForOptions(options, initialValues),
  );
  const router = useRouter();
  const hasChanges =
    JSON.stringify(values) !== JSON.stringify(valuesForOptions(options, initialValues));

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  function setValue(id: string, value: DiagramOptionValue): void {
    setValues((current) => ({ ...current, [id]: value }));
  }

  return (
    <Card
      title="Diagram options"
      titleId="stimulus-diagram-options-heading"
      description="Render options provided by the local KLighD client. Saving regenerates the diagram snapshot."
      headingLevel="h2"
    >
      <Box component="form" action={action}>
        <input type="hidden" name="stimulusId" value={stimulusId} />
        <input type="hidden" name="renderOptions" value={JSON.stringify(values)} />
        <Stack spacing={2}>
          <Options options={options} values={values} onChange={setValue} />
          {disabled ? (
            <Typography variant="body2" color="text.secondary">
              Diagram options are locked because this stimulus already has recorded sessions.
            </Typography>
          ) : null}
          <FormFeedback state={state} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              disabled={disabled || pending || !hasChanges}
              variant="contained"
              size="small"
            >
              {pending ? "Simulating diagram..." : "Save diagram options"}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}

function valuesForOptions(
  options: readonly DiagramOption[],
  initialValues: DiagramRenderOptions,
): Record<string, DiagramOptionValue> {
  return Object.fromEntries(
    options.map((option) => [option.id, initialValues[option.id] ?? option.currentValue]),
  );
}

interface OptionsProps {
  options: readonly DiagramOption[];
  values: Readonly<Record<string, DiagramOptionValue>>;
  categoryId?: string;
  onChange: (id: string, value: DiagramOptionValue) => void;
}

function Options({ options, values, categoryId, onChange }: OptionsProps) {
  return options
    .filter((option) => option.categoryId === categoryId)
    .map((option) => (
      <Option
        key={option.id}
        option={option}
        options={options}
        values={values}
        onChange={onChange}
      />
    ));
}

interface OptionProps {
  option: DiagramOption;
  options: readonly DiagramOption[];
  values: Readonly<Record<string, DiagramOptionValue>>;
  onChange: (id: string, value: DiagramOptionValue) => void;
}

function Option({ option, options, values, onChange }: OptionProps) {
  const value = values[option.id];

  if (option.kind === "separator") {
    return <Typography variant="subtitle2">{option.name}</Typography>;
  }

  if (option.kind === "category") {
    return (
      <Box
        component="details"
        open={Boolean(value)}
        onToggle={(event) => onChange(option.id, event.currentTarget.open)}
        sx={{ borderLeft: 2, borderColor: "divider", pl: 2 }}
      >
        <Box component="summary" sx={{ cursor: "pointer", fontWeight: "medium" }}>
          {option.name}
        </Box>
        {option.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {option.description}
          </Typography>
        ) : null}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Options options={options} values={values} categoryId={option.id} onChange={onChange} />
        </Stack>
      </Box>
    );
  }

  if (option.kind === "check") {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(value)}
            onChange={(event) => onChange(option.id, event.target.checked)}
          />
        }
        label={<OptionLabel option={option} />}
      />
    );
  }

  if (option.kind === "choice") {
    return (
      <TextField
        select
        label={option.name}
        value={value}
        helperText={option.description}
        onChange={(event) => onChange(option.id, event.target.value)}
        fullWidth
      >
        {option.values?.map((choice) => (
          <MenuItem key={String(choice)} value={String(choice)}>
            {String(choice)}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (option.kind === "range") {
    return (
      <TextField
        label={option.name}
        type="number"
        value={value}
        helperText={option.description}
        slotProps={{
          htmlInput: option.range
            ? { min: option.range.min, max: option.range.max, step: option.range.step }
            : {},
        }}
        onChange={(event) => onChange(option.id, Number(event.target.value))}
        fullWidth
      />
    );
  }

  return (
    <TextField
      label={option.name}
      value={value}
      helperText={option.description}
      onChange={(event) => onChange(option.id, event.target.value)}
      fullWidth
    />
  );
}

function OptionLabel({ option }: { option: DiagramOption }) {
  return (
    <Box>
      <Typography component="span">{option.name}</Typography>
      {option.description ? (
        <Typography variant="body2" color="text.secondary">
          {option.description}
        </Typography>
      ) : null}
    </Box>
  );
}
