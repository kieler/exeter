"use client";

import Link from "@mui/material/Link";
import type { GridColDef } from "@mui/x-data-grid";
import NextLink from "@/components/next-link";
import { SelectableDataGrid } from "@/components/selectable-data-grid";
import type { ModelListItem } from "@/lib/models";
import { formatDateTime } from "@/lib/format-date-time";
import { getModelPath } from "@/routes";
import { deleteModels } from "../actions";

/** Displays the persisted diagram models available for stimuli. */
export function ModelTable({ models }: { models: readonly ModelListItem[] }) {
  return (
    <SelectableDataGrid
      rows={models}
      columns={columns}
      emptyMessage="No models found."
      deleteAction={deleteModels}
      deleteActionTargetId="models-list-delete-action"
      deleteConfirmation={(selected) => `Delete ${selected.length} selected model(s)?`}
      isDeleteDisabled={(selected) => selected.some((model) => model.stimulusCount > 0)}
    />
  );
}

const columns: GridColDef<ModelListItem>[] = [
  {
    field: "name",
    headerName: "Name",
    minWidth: 180,
    flex: 1,
    renderCell: (params) => <Link component={NextLink} href={getModelPath(params.row.id)} sx={{ fontWeight: 500 }}>{params.row.name}</Link>,
  },
  { field: "description", headerName: "Description", minWidth: 260, flex: 2, valueGetter: (_value, row) => row.description || "—" },
  { field: "createdAt", headerName: "Created", width: 180, renderCell: (params) => formatDateTime(params.row.createdAt, "table") },
  { field: "updatedAt", headerName: "Updated", width: 180, renderCell: (params) => params.row.updatedAt ? formatDateTime(params.row.updatedAt, "table") : "—" },
];
