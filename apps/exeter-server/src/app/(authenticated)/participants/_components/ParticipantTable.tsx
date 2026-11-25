"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import type { GridColDef } from "@mui/x-data-grid";
import NextLink from "@/components/next-link";
import { ParticipantIdentity } from "@/components/participant-identity";
import { SelectableDataGrid } from "@/components/selectable-data-grid";
import type { ParticipantListItem } from "@/lib/participants";
import { formatDateTime } from "@/lib/format-date-time";
import { getSurveyPath } from "@/routes";
import { deleteParticipants } from "../actions";

const integerFormatter = new Intl.NumberFormat("de-DE");

/** Displays recorded participants and their aggregate activity. */
export function ParticipantTable({ participants }: { participants: readonly ParticipantListItem[] }) {
  return (
    <SelectableDataGrid
      rows={participants}
      columns={columns}
      emptyMessage="No participants found."
      deleteAction={deleteParticipants}
      deleteActionTargetId="participants-list-delete-action"
      deleteConfirmation={(selected) => `Delete ${selected.length} selected participant(s)?`}
      isDeleteDisabled={(selected) => selected.some((participant) => participant.sessionCount > 0)}
    />
  );
}

const columns: GridColDef<ParticipantListItem>[] = [
  { field: "id", headerName: "Participant", minWidth: 220, flex: 1, renderCell: (params) => <ParticipantCell participantId={params.row.id} /> },
  { field: "externalParticipantId", headerName: "External participant ID", minWidth: 200, flex: 1, valueGetter: (_value, row) => row.externalParticipantId ?? "—" },
  { field: "survey", headerName: "Survey", minWidth: 180, flex: 1, renderCell: (params) => <Link component={NextLink} href={getSurveyPath(params.row.survey.id)}>{params.row.survey.name}</Link> },
  { field: "createdAt", headerName: "Created", width: 180, renderCell: (params) => formatDateTime(params.row.createdAt, "table") },
  { field: "sessionCount", headerName: "Sessions", type: "number", width: 120, align: "right", headerAlign: "right", renderCell: (params) => integerFormatter.format(params.row.sessionCount) },
  { field: "stimulusCount", headerName: "Stimuli", type: "number", width: 130, align: "right", headerAlign: "right", renderCell: (params) => integerFormatter.format(params.row.stimulusCount) },
];

function ParticipantCell({ participantId }: { participantId: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
      <ParticipantIdentity participantId={participantId} />
    </Box>
  );
}
