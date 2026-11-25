import NextLink from "@/components/next-link";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { userDetailsSelect } from "@/lib/auth/users";
import { prisma } from "@/lib/prisma/client";
import { getUserPath, PATH_NEW_USER } from "@/routes";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  await requireUser();
  const users = await prisma.authUser.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: userDetailsSelect,
  });

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>
        <PageHeader
          title="Users"
          actions={<Button component={NextLink} href={PATH_NEW_USER} variant="contained">New user</Button>}
        />
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell component="th" scope="row">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">
                    <Button component={NextLink} href={getUserPath(user.id)} aria-label={`Edit ${user.name}`}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Container>
  );
}
