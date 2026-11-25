import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { PATH_USERS } from "@/routes";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { UserForm } from "../_components/UserForm";

export const metadata = { title: "New user" };

export default function NewUserPage() {
  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>
        <PageHeader title="New user" actions={<Button component={NextLink} href={PATH_USERS}>Back to users</Button>} />
        <UserForm />
      </Stack>
    </Container>
  );
}
