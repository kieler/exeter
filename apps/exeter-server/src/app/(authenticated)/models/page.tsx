import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { modelRepository } from "@/lib/models";
import { PATH_NEW_MODEL } from "@/routes";
import type { Metadata } from "next";
import { ModelTable } from "./_components/ModelTable";

export const metadata: Metadata = {
  title: "Models",
};

/**
 * Lists diagram models available for embedded stimuli.
 */
export default async function ModelsPage() {
  const models = await modelRepository.listModels();

  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="Models"
          subtitle="You can upload and manage models through this page. Models can be used in Stimuli."
          actions={
            <>
              <Box id="models-list-delete-action" />
              <Button
                component={NextLink}
                href={PATH_NEW_MODEL}
                variant="contained"
                size="small"
                startIcon={<AddOutlinedIcon />}
              >
                New model
              </Button>
            </>
          }
        />
      </Box>
      <ModelTable models={models} />
    </Container>
  );
}
