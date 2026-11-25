"use client";

import { FormFeedback } from "@/components/form-feedback";
import { initialFormActionState } from "@/lib/form/action-state";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState, useState } from "react";
import { createUser, updateUser } from "../actions";

export function UserForm({ user }: { user?: { id: string; name: string; email: string } }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [state, action, pending] = useActionState(
    user ? updateUser.bind(null, user.id) : createUser,
    initialFormActionState,
  );

  return (
    <Box component="form" action={action} sx={{ maxWidth: "32rem" }}>
      <Stack spacing={3}>
        <TextField
          name="name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          name="password"
          label={user ? "New password" : "Password"}
          type="password"
          autoComplete="new-password"
          required={!user}
          helperText={user ? "Leave blank to keep the current password." : "Use at least 8 characters."}
          slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
        />
        <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: "flex-start" }}>
          {pending ? "Saving…" : user ? "Save user" : "Create user"}
        </Button>
        <FormFeedback state={state} />
      </Stack>
    </Box>
  );
}
