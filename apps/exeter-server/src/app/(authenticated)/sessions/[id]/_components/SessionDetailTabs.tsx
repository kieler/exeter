"use client";

import NextLink from "@/components/next-link";
import { getSessionEventsPath, getSessionPath } from "@/routes";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useSelectedLayoutSegment } from "next/navigation";

/** Renders URL-backed tabs for the mutually exclusive session-detail views. */
export function SessionDetailTabs({ sessionId }: { sessionId: string }) {
  const segment = useSelectedLayoutSegment();

  return (
    <Tabs value={segment ?? "overview"} aria-label="Session detail views" sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
      <Tab component={NextLink} href={getSessionPath(sessionId)} label="Overview" value="overview" />
      <Tab component={NextLink} href={getSessionEventsPath(sessionId)} label="Events" value="events" />
    </Tabs>
  );
}
