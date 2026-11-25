import { getUser } from "@/lib/auth";
import { PATH_HOME } from "@/routes";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  const user = await getUser();

  if (user) {
    redirect(PATH_HOME);
  }

  return (
    <Box component="main" sx={{ display: "flex", minHeight: "100dvh", alignItems: "center", py: 6 }}>
      <Container maxWidth="xs">
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 4 }}>Sign in</Typography>
        <SignInForm />
      </Container>
    </Box>
  );
}
