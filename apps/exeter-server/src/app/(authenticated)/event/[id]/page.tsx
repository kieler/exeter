import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { eventRepository } from "@/lib/events";
import { formatDateTime } from "@/lib/format-date-time";
import { getSessionPath } from "@/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Event",
};

/** Shows the complete persisted payload and metadata of one recorded event. */
export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await eventRepository.getEvent(id);
  if (!event) {
    notFound();
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <PageHeader
          title="Event"
          subtitle={<Box component="span" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>{event.id}</Box>}
          actions={
            <Button component={NextLink} href={getSessionPath(event.sessionId)} variant="outlined" size="small" startIcon={<ArrowBackOutlinedIcon />}>
              View session
            </Button>
          }
        />
      </Box>

      <Paper variant="outlined">
        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h6">Event details</Typography>
            <Chip label={event.type} size="small" />
          </Stack>
          <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 3, m: 0 }}>
            <MetadataItem label="Sequence" value={String(event.sequence)} />
            <MetadataItem label="Occurred at" value={formatDateTime(event.occurredAt)} />
            <MetadataItem label="Received at" value={formatDateTime(event.receivedAt)} />
          </Box>
          <Divider />
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Event data</Typography>
            <Paper component="pre" variant="outlined" sx={{ m: 0, maxHeight: "70vh", overflow: "auto", p: 2, fontFamily: "monospace", fontSize: "0.875rem", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {JSON.stringify(event.data, null, 2) ?? "null"}
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
      <Typography component="dd" sx={{ m: 0 }}>{value}</Typography>
    </Box>
  );
}
