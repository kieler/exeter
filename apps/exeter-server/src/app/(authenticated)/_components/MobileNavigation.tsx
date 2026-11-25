"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { SidebarContent } from "./SidebarContent";
import { SidebarHeader } from "./SidebarHeader";
import type { AuthenticatedUser } from "./UserMenu";

interface MobileNavigationProps {
  user: AuthenticatedUser;
}

/**
 * Renders the compact app bar and temporary navigation drawer on mobile screens.
 */
export function MobileNavigation({ user }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: { lg: "none" } }}>
      <AppBar position="fixed" color="inherit" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Exeter</Typography>
          <IconButton
            color="inherit"
            edge="end"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            sx={{ width: 40, height: 40 }}
          >
            <MenuOutlinedIcon sx={{ width: 24, height: 24, fontSize: 24 }} />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <Box sx={{ display: "flex", width: 288, maxWidth: "calc(100vw - 3rem)", height: "100%", flexDirection: "column" }}>
          <SidebarHeader action={<IconButton edge="end" aria-label="Close navigation" onClick={() => setOpen(false)}><CloseOutlinedIcon /></IconButton>} />
          <SidebarContent user={user} onNavigate={() => setOpen(false)} />
        </Box>
      </Drawer>
    </Box>
  );
}
