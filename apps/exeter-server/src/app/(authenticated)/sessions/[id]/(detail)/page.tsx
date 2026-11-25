import Grid from "@mui/material/Grid";
import { PieChartCard } from "@/components/pie-chart-card";
import { SessionReplayPlayer } from "../_components/SessionReplayPlayer";
import { getEventCountPerType } from "@/lib/events";

interface SessionOverviewPageProps {
  params: Promise<{ id: string }>;
}

/** Summarises the session alongside its browser replay. */
export default async function SessionOverviewPage({ params }: SessionOverviewPageProps) {
  const { id } = await params;
  const eventTypes = await getEventCountPerType(id);

  return (
    <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <PieChartCard
          title="Event type counts"
          description="Recorded events grouped by type."
          data={eventTypes.map((eventType) => ({ name: eventType.type, value: eventType.count }))}
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <SessionReplayPlayer sessionId={id} />
      </Grid>
    </Grid>
  );
}
