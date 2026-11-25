"use client";

import Link from "@mui/material/Link";
import type { GridColDef } from "@mui/x-data-grid";
import NextLink from "@/components/next-link";
import { SelectableDataGrid } from "@/components/selectable-data-grid";
import type { StimulusListItem } from "@/lib/stimuli";
import { formatDateTime } from "@/lib/format-date-time";
import { getStimulusPath, getModelPath, getSurveyPath } from "@/routes";
import { deleteStimuli } from "../actions";

/** Displays configured stimuli and their bound diagram models. */
export function StimulusTable({ stimuli }: { stimuli: readonly StimulusListItem[] }) {
  return (
    <SelectableDataGrid
      rows={stimuli}
      columns={columns}
      emptyMessage="No stimuli found."
      deleteAction={deleteStimuli}
      deleteActionTargetId="stimuli-list-delete-action"
      deleteConfirmation={(selected) => `Delete ${selected.length} selected stimulus(s)?`}
      isDeleteDisabled={(selected) => selected.some((stimulus) => stimulus.sessionCount > 0)}
    />
  );
}

const columns: GridColDef<StimulusListItem>[] = [
  {
    field: "name",
    headerName: "Name",
    minWidth: 180,
    flex: 1,
    renderCell: (params) => <Link component={NextLink} href={getStimulusPath(params.row.id)} sx={{ fontWeight: 500 }}>{params.row.name}</Link>,
  },
  {
    field: "model",
    headerName: "Model",
    minWidth: 180,
    flex: 1,
    renderCell: (params) => <Link component={NextLink} href={getModelPath(params.row.model.id)}>{params.row.model.name}</Link>,
  },
  {
    field: "survey",
    headerName: "Survey",
    minWidth: 180,
    flex: 1,
    renderCell: (params) => <Link component={NextLink} href={getSurveyPath(params.row.survey.id)}>{params.row.survey.name}</Link>,
  },
  { field: "description", headerName: "Description", minWidth: 260, flex: 2, valueGetter: (_value, row) => row.description || "—" },
  { field: "createdAt", headerName: "Created", width: 180, renderCell: (params) => formatDateTime(params.row.createdAt, "table") },
  { field: "updatedAt", headerName: "Updated", width: 180, renderCell: (params) => params.row.updatedAt ? formatDateTime(params.row.updatedAt, "table") : "—" },
];
