import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

/** Standard page header with optional, right-aligned actions. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Stack
      component="header"
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ justifyContent: "space-between" }}
    >
      <Box>
        <Typography variant="h4" component="h1">{title}</Typography>
        {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      {actions ? <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}>{actions}</Stack> : null}
    </Stack>
  );
}
