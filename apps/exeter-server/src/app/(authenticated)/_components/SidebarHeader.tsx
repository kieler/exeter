import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export function SidebarHeader({
  action,
  showTitle = true,
}: {
  action?: ReactNode;
  showTitle?: boolean;
}) {
  return (
    <Toolbar sx={{ minHeight: 64, borderBottom: 1, borderColor: "divider" }}>
      {showTitle ? (
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>Exeter</Typography>
      ) : null}
      {action ? <>{action}</> : null}
    </Toolbar>
  );
}
