"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { ReactNode } from "react";
import { useState } from "react";

interface StimulusDetailTabsProps {
  overview: ReactNode;
  diagramOptions: ReactNode;
  synthesisOptions: ReactNode;
  sessions: ReactNode;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "diagram-options", label: "Diagram options" },
  { id: "synthesis-options", label: "Synthesis Options" },
  { id: "sessions", label: "Sessions" },
] as const;

/** Groups a stimulus's overview, configuration, and session content into tabs. */
export function StimulusDetailTabs({
  overview,
  diagramOptions,
  synthesisOptions,
  sessions,
}: StimulusDetailTabsProps) {
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const panels: Record<(typeof tabs)[number]["id"], ReactNode> = {
    overview,
    "diagram-options": diagramOptions,
    "synthesis-options": synthesisOptions,
    sessions,
  };

  return (
    <>
      <Tabs
        value={selectedTab}
        onChange={(_event, value: string) => setSelectedTab(value)}
        aria-label="Stimulus sections"
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mt: -4, mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={`stimulus-tab-${tab.id}`}
            aria-controls={`stimulus-panel-${tab.id}`}
            label={tab.label}
            value={tab.id}
          />
        ))}
      </Tabs>
      {tabs.map((tab) => (
        <Box
          key={tab.id}
          role="tabpanel"
          id={`stimulus-panel-${tab.id}`}
          aria-labelledby={`stimulus-tab-${tab.id}`}
          hidden={selectedTab !== tab.id}
          tabIndex={selectedTab === tab.id ? 0 : undefined}
        >
          {panels[tab.id]}
        </Box>
      ))}
    </>
  );
}
