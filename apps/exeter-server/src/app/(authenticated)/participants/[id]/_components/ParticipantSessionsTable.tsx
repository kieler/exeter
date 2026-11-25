import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/next-link";
import { SessionClientDisplay } from "@/components/session-client";
import type { ParticipantSession } from "@/lib/participants";
import { formatDateTime } from "@/lib/format-date-time";
import { getStimulusPath, getSessionPath } from "@/routes";

const integerFormatter = new Intl.NumberFormat("de-DE");

/**
 * Displays sessions recorded under one participant without introducing a nested card.
 */
export function ParticipantSessionsTable({ sessions }: { sessions: readonly ParticipantSession[] }) {
  if (sessions.length === 0) {
    return <EmptyTable message="No sessions have been recorded for this participant." />;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead><TableRow><TableCell>Session</TableCell><TableCell>Stimulus</TableCell><TableCell>Started at</TableCell><TableCell>Last update</TableCell><TableCell align="right">Events</TableCell><TableCell>Client</TableCell></TableRow></TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                <Link component={NextLink} href={getSessionPath(session.id)} title={session.id}>
                  {session.id.split("-", 1)[0]}
                </Link>
              </TableCell>
              <TableCell>
                {session.stimulus ? (
                  <Link component={NextLink} href={getStimulusPath(session.stimulus.id)}>
                    {session.stimulus.name}
                  </Link>
                ) : "—"}
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(session.createdAt, "table")}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(session.lastReceivedAt, "table")}</TableCell>
              <TableCell align="right">{integerFormatter.format(session.eventCount)}</TableCell>
              <TableCell><SessionClientDisplay client={session.client} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Renders a table-card empty state without another table border.
 */
function EmptyTable({ message }: { message: string }) {
  return <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>{message}</Typography>;
}
