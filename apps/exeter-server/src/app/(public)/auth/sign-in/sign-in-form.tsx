"use client";

import { authClient } from "@/lib/auth/auth-client";
import { PATH_HOME } from "@/routes";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });

      if (result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.replace(PATH_HOME);
      router.refresh();
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Paper
      component="form"
      method="post"
      onSubmit={handleSubmit}
      variant="outlined"
      sx={{ p: 3 }}
    >
      <Stack spacing={2.5}>
      <TextField name="email" type="email" label="Email" autoComplete="email" required fullWidth />
      <TextField name="password" type="password" label="Password" autoComplete="current-password" required fullWidth />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="contained"
        size="large"
        fullWidth
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
      </Stack>
    </Paper>
  );
}
