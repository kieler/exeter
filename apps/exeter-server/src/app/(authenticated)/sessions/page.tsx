import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { PageHeader } from "@/components/page-header";
import { sessionRepository } from "@/lib/sessions";
import type { Metadata } from "next";
import { SessionTable } from "./_components/SessionTable";

export const metadata: Metadata = {
  title: "Sessions",
};

/** Shows the recorded diagram interaction sessions. */
export default async function SessionsPage() {
  const sessions = await sessionRepository.listSessions();

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="Sessions"
          subtitle="Recorded diagram interaction sessions."
          actions={<Box id="sessions-list-delete-action" />}
        />
      </Box>
      <SessionTable sessions={sessions} />
    </Container>
  );
}
