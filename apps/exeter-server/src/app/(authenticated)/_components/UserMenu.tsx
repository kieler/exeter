import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LogoutButton } from "./LogoutButton";

export interface AuthenticatedUser {
  name: string;
  email: string;
}

export function UserMenu({ user }: { user: AuthenticatedUser }) {
  return (
    <Box sx={{ mt: "auto", borderTop: 1, borderColor: "divider", p: 1.5 }}>
      <Typography variant="body2" noWrap sx={{ px: 1.5, fontWeight: 500 }}>{user.name}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", px: 1.5 }}>{user.email}</Typography>
      <LogoutButton />
    </Box>
  );
}
