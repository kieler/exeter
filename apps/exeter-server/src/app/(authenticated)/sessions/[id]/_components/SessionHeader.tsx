import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { ParticipantIdentity } from "@/components/participant-identity";
import { SessionClientDisplay } from "@/components/session-client";
import type { SessionClient, SessionStimulus, SessionParticipant } from "@/lib/sessions";
import { formatDateTime } from "@/lib/format-date-time";
import { getStimulusPath, getSurveyPath } from "@/routes";
import type { ReactNode } from "react";

export interface SessionHeaderProps {
  sessionId: string;
  externalSessionId: string | null;
  startedAt: Date;
  lastUpdatedAt: Date;
  client: SessionClient | null;
  sessionLength: string;
  batchCount: number;
  eventCount: number;
  stimulus: SessionStimulus | null;
  participant: SessionParticipant | null;
  action?: ReactNode;
}

interface SessionMetadataProps {
  label: string;
  value: ReactNode;
  sx?: SxProps<Theme>;
}

/** Renders the identity and basic recorded metadata of one session. */
export function SessionHeader({
  sessionId,
  externalSessionId,
  startedAt,
  lastUpdatedAt,
  client,
  sessionLength,
  batchCount,
  eventCount,
  stimulus,
  participant,
  action,
}: SessionHeaderProps) {
  return (
    <Box component="header">
      <PageHeader
        title="Session"
        actions={action}
      />
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 1.5, my: 2 }}>
        <SessionMetadata label="Started at" value={formatDateTime(startedAt)} />
        <SessionMetadata label="Last update" value={formatDateTime(lastUpdatedAt)} />
        <SessionMetadata label="External session ID" value={externalSessionId ?? "—"} />
        <SessionMetadata
          label="Stimulus"
          value={stimulus ? (
            <Link
              component={NextLink}
              href={getStimulusPath(stimulus.id)}
            >
              {stimulus.name}
            </Link>
          ) : "—"}
        />
        <SessionMetadata
          label="Survey"
          value={stimulus ? <Link component={NextLink} href={getSurveyPath(stimulus.survey.id)}>{stimulus.survey.name}</Link> : "—"}
        />
        <SessionMetadata label="Participant" value={participant ? <ParticipantIdentity participantId={participant.id} /> : "—"} />
        <SessionMetadata
          label="Client info"
          value={<SessionClientDisplay client={client} showLabels />}
          sx={{ gridColumn: { sm: "span 2" } }}
        />
        <SessionMetadata
          label="Session info"
          value={
            <Box component="span" sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.5 }}>
              <Typography component="span" variant="body2">Length: {sessionLength}</Typography>
              <Typography component="span" variant="body2">Batches: {batchCount}</Typography>
              <Typography component="span" variant="body2">Events: {eventCount}</Typography>
            </Box>
          }
          sx={{ gridColumn: { sm: "span 2" } }}
        />
        <SessionMetadata
          label="Session ID"
          value={<Box component="span" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{sessionId}</Box>}
          sx={{ gridColumn: { sm: "span 2" } }}
        />
      </Box>
      <Divider />
    </Box>
  );
}

/** Renders one label/value pair in the session metadata header. */
function SessionMetadata({ label, value, sx }: SessionMetadataProps) {
  return (
    <Box
      sx={[
        {
          display: "grid",
          gridTemplateRows: "auto 1fr",
          rowGap: 0.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          px: 1.25,
          py: 0.75,
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography component="dt" variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography component="dd" sx={{ alignSelf: "center", m: 0, fontWeight: 500, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
}
