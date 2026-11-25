import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import { SidebarContent } from "./SidebarContent";
import { SidebarHeader } from "./SidebarHeader";
import type { AuthenticatedUser } from "./UserMenu";

interface DesktopSidebarProps {
  user: AuthenticatedUser;
}

export const DESKTOP_SIDEBAR_WIDTH = 256;

/**
 * Renders the always-visible navigation sidebar on desktop viewports.
 */
export function DesktopSidebar({ user }: DesktopSidebarProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", lg: "block" },
        "& .MuiDrawer-paper": { boxSizing: "border-box", width: DESKTOP_SIDEBAR_WIDTH },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <SidebarHeader />
        <SidebarContent user={user} />
      </Stack>
    </Drawer>
  );
}
