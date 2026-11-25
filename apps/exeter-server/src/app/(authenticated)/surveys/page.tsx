import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { surveyRepository } from "@/lib/surveys";
import { PATH_NEW_SURVEY } from "@/routes";
import type { Metadata } from "next";
import { SurveyTable } from "./_components/SurveyTable";

export const metadata: Metadata = { title: "Surveys" };

export default async function SurveysPage() {
  const surveys = await surveyRepository.listSurveys();
  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title="Surveys"
          subtitle="Studies that group their stimuli and participants."
          actions={<><Box id="surveys-list-delete-action" /><Button component={NextLink} href={PATH_NEW_SURVEY} variant="contained" size="small" startIcon={<AddOutlinedIcon />}>New survey</Button></>}
        />
      </Box>
      <SurveyTable surveys={surveys} />
    </Container>
  );
}
