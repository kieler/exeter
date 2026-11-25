import { PageHeader } from "@/components/page-header";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { ModelCreateForm } from "../_components/ModelCreateForm";

export const metadata: Metadata = {
  title: "New model",
};

/**
 * Creates metadata for a model before its source file is uploaded.
 */
export default function NewModelPage() {
  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="New model"
          subtitle="Create the model record, then upload its source file."
        />
      </Box>
      <ModelCreateForm />
    </Container>
  );
}
