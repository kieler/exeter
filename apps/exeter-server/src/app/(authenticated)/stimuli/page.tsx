import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { stimulusRepository } from "@/lib/stimuli";
import { PATH_NEW_STIMULUS } from "@/routes";
import type { Metadata } from "next";
import { StimulusTable } from "./_components/StimulusTable";

export const metadata: Metadata = {
  title: "Stimuli",
};

/**
 * Lists diagram stimuli available for external embedding.
 */
export default async function StimuliPage() {
  const stimuli = await stimulusRepository.listStimuli();

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="Stimuli"
          subtitle="Configured model embeds that own recorded interaction sessions."
          actions={
            <>
              <Box id="stimuli-list-delete-action" />
              <Button component={NextLink} href={PATH_NEW_STIMULUS} variant="contained" size="small" startIcon={<AddOutlinedIcon />}>New stimulus</Button>
            </>
          }
        />
      </Box>
      <StimulusTable stimuli={stimuli} />
    </Container>
  );
}
