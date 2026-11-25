"use client";

import NextLink from "@/components/next-link";
import { SelectableDataGrid } from "@/components/selectable-data-grid";
import { formatDateTime } from "@/lib/format-date-time";
import type { SurveyListItem } from "@/lib/surveys";
import { getSurveyPath } from "@/routes";
import Link from "@mui/material/Link";
import type { GridColDef } from "@mui/x-data-grid";
import { deleteSurveys } from "../actions";

/** Displays configured surveys and their collected records. */
export function SurveyTable({ surveys }: { surveys: readonly SurveyListItem[] }) {
  return (
    <SelectableDataGrid
      rows={surveys}
      columns={columns}
      emptyMessage="No surveys found."
      deleteAction={deleteSurveys}
      deleteActionTargetId="surveys-list-delete-action"
      deleteConfirmation={(selected) => `Delete ${selected.length} selected survey(s)?`}
      isDeleteDisabled={(selected) => selected.some((survey) => survey.stimulusCount > 0 || survey.participantCount > 0)}
    />
  );
}

const columns: GridColDef<SurveyListItem>[] = [
  { field: "name", headerName: "Name", minWidth: 200, flex: 1, renderCell: (params) => <Link component={NextLink} href={getSurveyPath(params.row.id)} sx={{ fontWeight: 500 }}>{params.row.name}</Link> },
  { field: "description", headerName: "Description", minWidth: 260, flex: 2, valueGetter: (_value, row) => row.description || "—" },
  { field: "stimulusCount", headerName: "Stimuli", type: "number", width: 110, align: "right", headerAlign: "right" },
  { field: "participantCount", headerName: "Participants", type: "number", width: 130, align: "right", headerAlign: "right" },
  { field: "createdAt", headerName: "Created", width: 180, renderCell: (params) => formatDateTime(params.row.createdAt, "table") },
  { field: "updatedAt", headerName: "Updated", width: 180, renderCell: (params) => params.row.updatedAt ? formatDateTime(params.row.updatedAt, "table") : "—" },
];
