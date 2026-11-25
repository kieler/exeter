import { Card } from "@/components/card";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/format-date-time";
import { stimulusRepository } from "@/lib/stimuli";
import { modelRepository } from "@/lib/models";
import { participantRepository } from "@/lib/participants";
import { surveyRepository } from "@/lib/surveys";
import { sessionRepository, type SessionListItem } from "@/lib/sessions";
import { PATH_STIMULI, PATH_MODELS, PATH_PARTICIPANTS, PATH_SESSIONS, PATH_SURVEYS } from "@/routes";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HealthCard } from "./_components/HealthCard";
import { SessionsByDayChart } from "./_components/SessionsByDayChart";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [user, models, surveys, stimuli, sessions, participants] = await Promise.all([
    requireUser(),
    modelRepository.listModels(),
    surveyRepository.listSurveys(),
    stimulusRepository.listStimuli(),
    sessionRepository.listSessions(),
    participantRepository.listParticipants(),
  ]);
  const sessionsByDay = groupSessionsByDay(sessions);

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader title={`Hello, ${user.name}`} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(360px, 1fr)" }, gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 3 }}>
          <DashboardCountCard title="Models" icon={<AccountTreeOutlinedIcon />} count={models.length} href={PATH_MODELS} />
          <DashboardCountCard title="Surveys" icon={<AssignmentOutlinedIcon />} count={surveys.length} href={PATH_SURVEYS} />
          <DashboardCountCard title="Stimuli" icon={<ScienceOutlinedIcon />} count={stimuli.length} href={PATH_STIMULI} />
          <DashboardCountCard title="Sessions" icon={<DesktopWindowsOutlinedIcon />} count={sessions.length} href={PATH_SESSIONS} />
          <DashboardCountCard title="Participants" icon={<PeopleOutlinedIcon />} count={participants.length} href={PATH_PARTICIPANTS} />
        </Box>
        <HealthCard />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Card
          title="Sessions by day"
          description="Recorded sessions over the last two weeks."
          headingLevel="h2"
        >
          <SessionsByDayChart
            labels={sessionsByDay.map((day) => formatDate(day.date))}
            values={sessionsByDay.map((day) => day.count)}
          />
        </Card>
      </Box>
    </Container>
  );
}

function DashboardCountCard({
  title,
  icon,
  count,
  href,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  href: string;
}) {
  return (
    <Card
      title={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{icon}{title}</Box>}
      action={
        <Button component={NextLink} href={href} size="small">
          See all
        </Button>
      }
      sx={{ minWidth: 0 }}
    >
      <Typography variant="h3" component="p">
        {count}
      </Typography>
    </Card>
  );
}

function groupSessionsByDay(
  sessions: readonly SessionListItem[],
): Array<{ date: Date; count: number }> {
  const dayFormatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const counts = new Map<string, number>();

  for (const session of sessions) {
    const key = dayFormatter.format(session.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    return { date, count: counts.get(dayFormatter.format(date)) ?? 0 };
  });
}
