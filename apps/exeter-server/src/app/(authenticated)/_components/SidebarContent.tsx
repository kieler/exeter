"use client";

import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { PATH_DASHBOARD, PATH_STIMULI, PATH_MODELS, PATH_PARTICIPANTS, PATH_SESSIONS, PATH_SURVEYS, PATH_USERS } from "@/routes";
import NextLink from "@/components/next-link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { type AuthenticatedUser, UserMenu } from "./UserMenu";

export function SidebarContent({
  user,
  onNavigate,
}: {
  user: AuthenticatedUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex", height: "100%", flex: 1, flexDirection: "column" }}>
      <Box component="nav" sx={{ flex: 1, p: 1 }}>
        <List disablePadding>
        <NavEntry href={PATH_DASHBOARD} icon={<DashboardOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Dashboard
        </NavEntry>
        <NavEntry href={PATH_MODELS} icon={<AccountTreeOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Models
        </NavEntry>
        <NavEntry href={PATH_SURVEYS} icon={<AssignmentOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Surveys
        </NavEntry>
        <NavEntry href={PATH_STIMULI} icon={<ScienceOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Stimuli
        </NavEntry>
        <NavEntry href={PATH_PARTICIPANTS} icon={<PeopleOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Participants
        </NavEntry>
        <NavEntry href={PATH_SESSIONS} icon={<DesktopWindowsOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Sessions
        </NavEntry>
        <NavEntry href={PATH_USERS} icon={<ManageAccountsOutlinedIcon />} pathname={pathname} onNavigate={onNavigate}>
          Users
        </NavEntry>
        </List>
      </Box>
      <UserMenu user={user} />
    </Box>
  );
}

interface NavEntryProps {
  children: string;
  href: string;
  icon: ReactNode;
  pathname: string;
  onNavigate?: () => void;
}

/**
 * Renders one sidebar navigation link and its matching active state.
 */
function NavEntry({
  children,
  href,
  icon,
  pathname,
  onNavigate,
}: NavEntryProps) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ListItemButton
      component={NextLink}
      href={href}
      selected={isActive}
      onClick={onNavigate}
      sx={{ mb: 0.5 }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={children} />
    </ListItemButton>
  );
}
