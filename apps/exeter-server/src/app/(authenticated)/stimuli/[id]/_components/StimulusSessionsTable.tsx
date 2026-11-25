import Box from "@mui/material/Box";
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
import { ParticipantIdentity } from "@/components/participant-identity";
import type { StimulusSession } from "@/lib/stimuli";
import { formatDateTime } from "@/lib/format-date-time";
import { getSessionPath } from "@/routes";

const integerFormatter = new Intl.NumberFormat("de-DE");
const ACTIVE_SESSION_THRESHOLD_MS = 60_000;

/**
 * Displays only the sessions owned by the current stimulus.
 */
export function StimulusSessionsTable({ sessions }: { sessions: readonly StimulusSession[] }) {
  const referenceTime = new Date();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead><TableRow><TableCell align="center">Status</TableCell><TableCell>Session</TableCell><TableCell>Started at</TableCell><TableCell>Last update</TableCell><TableCell align="right">Events</TableCell><TableCell>Participant</TableCell><TableCell>Client</TableCell></TableRow></TableHead>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No sessions have been recorded for this stimulus.</Typography></TableCell></TableRow>
          ) : sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell align="center"><Box component="span" className={isActiveSession(session, referenceTime) ? "active-session-status" : "inactive-session-status"} /></TableCell>
              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}><SessionIdLink sessionId={session.id} /></TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(session.createdAt, "table")}</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(session.lastReceivedAt, "table")}</TableCell>
              <TableCell align="right">{integerFormatter.format(session.eventCount)}</TableCell>
              <TableCell>{session.participant ? <ParticipantIdentity participantId={session.participant.id} /> : "—"}</TableCell>
              <TableCell><SessionClientDisplay client={session.client} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SessionIdLink({ sessionId }: { sessionId: string }) {
  return (
    <Link
      component={NextLink}
      href={getSessionPath(sessionId)}
      title={sessionId}
    >
      {sessionId.split("-", 1)[0]}
    </Link>
  );
}

function isActiveSession(session: StimulusSession, referenceTime: Date): boolean {
  const ageMs = referenceTime.getTime() - session.lastReceivedAt.getTime();
  return ageMs >= 0 && ageMs <= ACTIVE_SESSION_THRESHOLD_MS;
}
