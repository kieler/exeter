import { PageHeader } from "@/components/page-header";
import { listSourceBackedModels } from "@/lib/models";
import { surveyRepository } from "@/lib/surveys";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { StimulusCreateForm } from "../_components/StimulusCreateForm";

export const metadata: Metadata = {
  title: "New stimulus",
};

/**
 * Creates a stimulus from a stored model with an uploaded source file.
 */
export default async function NewStimulusPage({ searchParams }: { searchParams: Promise<{ surveyId?: string }> }) {
  const [models, surveys] = await Promise.all([listSourceBackedModels(), surveyRepository.listSurveys()]);
  const { surveyId } = await searchParams;

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="New stimulus"
          subtitle="Bind an uploaded diagram model to a new embedded stimulus."
        />
      </Box>
      <StimulusCreateForm models={models} surveys={surveys} initialSurveyId={surveyId} />
    </Container>
  );
}
