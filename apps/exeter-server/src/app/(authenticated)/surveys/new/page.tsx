import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { PageHeader } from "@/components/page-header";
import type { Metadata } from "next";
import { SurveyCreateForm } from "../_components/SurveyForm";

export const metadata: Metadata = { title: "New survey" };

export default function NewSurveyPage() {
  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}><PageHeader title="New survey" subtitle="Create a study to group its stimuli and participants." /></Box>
      <SurveyCreateForm />
    </Container>
  );
}
