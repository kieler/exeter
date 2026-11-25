"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import type { GridColDef } from "@mui/x-data-grid";
import NextLink from "@/components/next-link";
import { ParticipantIdentity } from "@/components/participant-identity";
import { SelectableDataGrid } from "@/components/selectable-data-grid";
import { SessionClientDisplay } from "@/components/session-client";
import type { SessionListItem } from "@/lib/sessions";
import { formatDateTime } from "@/lib/format-date-time";
import { getStimulusPath, getSessionPath, getSurveyPath } from "@/routes";
import { deleteSessions } from "../actions";

const ACTIVE_SESSION_THRESHOLD_MS = 60_000;

const integerFormatter = new Intl.NumberFormat("de-DE");

/** Displays the stable, high-level fields of recorded interaction sessions. */
export function SessionTable({ sessions }: { sessions: readonly SessionListItem[] }) {
  const referenceTime = new Date();
  return (
    <SelectableDataGrid
      rows={sessions}
      columns={createSessionColumns(referenceTime)}
      emptyMessage="No sessions found."
      deleteAction={deleteSessions}
      deleteActionTargetId="sessions-list-delete-action"
      deleteConfirmation={(selected) => `Delete ${selected.length} selected session(s) and all recorded batches and events?`}
    />
  );
}

function createSessionColumns(referenceTime: Date): GridColDef<SessionListItem>[] {
  return [
    {
      field: "id",
      headerName: "Session",
      minWidth: 130,
      renderCell: (params) => <SessionIdLink sessionId={params.row.id} />,
    },
    {
      field: "externalSessionId",
      headerName: "External session ID",
      minWidth: 180,
      flex: 1,
      valueGetter: (_value, row) => row.externalSessionId ?? "—",
    },
    {
      field: "status",
      headerName: "Status",
      align: "center",
      headerAlign: "center",
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <SessionIndicator state={isActiveSession(params.row, referenceTime) ? "active" : "inactive"} />
      ),
    },
    {
      field: "createdAt",
      headerName: "Started at",
      width: 180,
      renderCell: (params) => formatDateTime(params.row.createdAt, "table"),
    },
    {
      field: "lastReceivedAt",
      headerName: "Last update",
      width: 180,
      renderCell: (params) => formatDateTime(params.row.lastReceivedAt, "table"),
    },
    {
      field: "eventCount",
      headerName: "Events",
      type: "number",
      align: "right",
      headerAlign: "right",
      width: 110,
      renderCell: (params) => formatInteger(params.row.eventCount),
    },
    {
      field: "stimulus",
      headerName: "Stimulus",
      minWidth: 180,
      flex: 1,
      renderCell: (params) => params.row.stimulus ? (
        <Link
          component={NextLink}
          href={getStimulusPath(params.row.stimulus.id)}
          title={params.row.stimulus.name}
        >
          {params.row.stimulus.name}
        </Link>
      ) : "—",
    },
    {
      field: "survey",
      headerName: "Survey",
      minWidth: 170,
      flex: 1,
      valueGetter: (_value, row) => row.stimulus?.survey.name ?? null,
      renderCell: (params) => params.row.stimulus ? (
        <Link component={NextLink} href={getSurveyPath(params.row.stimulus.survey.id)} title={params.row.stimulus.survey.name}>
          {params.row.stimulus.survey.name}
        </Link>
      ) : "—",
    },
    {
      field: "participant",
      headerName: "Participant",
      minWidth: 180,
      renderCell: (params) => params.row.participant ? <ParticipantCell participantId={params.row.participant.id} /> : "—",
    },
    {
      field: "client",
      headerName: "Client",
      minWidth: 130,
      renderCell: (params) => <SessionClientDisplay client={params.row.client} />,
    },
  ];
}

function SessionIndicator({ state }: { state: string }) {
  return <span className={`${state}-session-status`} />;
}

function ParticipantCell({ participantId }: { participantId: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
      <ParticipantIdentity participantId={participantId} />
    </Box>
  );
}

/** Links to a session while keeping its long UUID compact in the table. */
function SessionIdLink({ sessionId }: { sessionId: string }) {
  return (
    <Link
      component={NextLink}
      href={getSessionPath(sessionId)}
      title={sessionId}
      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
    >
      {uuidPrefix(sessionId)}
    </Link>
  );
}


function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

function uuidPrefix(value: string): string {
  return value.split("-", 1)[0] ?? value;
}

function isActiveSession(session: SessionListItem, referenceTime: Date): boolean {
  const ageMs = referenceTime.getTime() - session.lastReceivedAt.getTime();
  return ageMs >= 0 && ageMs <= ACTIVE_SESSION_THRESHOLD_MS;
}
