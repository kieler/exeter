import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { PageHeader } from "@/components/page-header";
import { participantRepository } from "@/lib/participants";
import type { Metadata } from "next";
import { ParticipantTable } from "./_components/ParticipantTable";

export const metadata: Metadata = {
  title: "Participants",
};

/**
 * Lists the anonymous participants identified across recorded sessions.
 */
export default async function ParticipantsPage() {
  const participants = await participantRepository.listParticipants();

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="Participants"
          subtitle="Anonymous browser identities linked to recorded sessions."
          actions={<Box id="participants-list-delete-action" />}
        />
      </Box>
      <ParticipantTable participants={participants} />
    </Container>
  );
}
