import { DeleteRecordsForm } from "@/components/delete-records-form";
import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { userDetailsSelect } from "@/lib/auth/users";
import { prisma } from "@/lib/prisma/client";
import { PATH_USERS } from "@/routes";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { notFound } from "next/navigation";
import { UserForm } from "../_components/UserForm";
import { deleteUser } from "../actions";

export const metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireUser();
  const { id } = await params;
  const user = await prisma.authUser.findUnique({ where: { id }, select: userDetailsSelect });
  if (!user) notFound();

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>
        <PageHeader
          title="Edit user"
          actions={
            <>
              <Button component={NextLink} href={PATH_USERS}>Back to users</Button>
              {actor.id !== user.id && (
                <DeleteRecordsForm
                  action={deleteUser}
                  ids={[user.id]}
                  label="Delete user"
                  confirmation={`Delete the account for ${user.email}?`}
                />
              )}
            </>
          }
        />
        <UserForm user={user} />
      </Stack>
    </Container>
  );
}
