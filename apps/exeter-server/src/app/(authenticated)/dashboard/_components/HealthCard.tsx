"use client";

import { Card } from "@/components/card";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface Health {
  checkedAt: string;
  memory: { used: number; total: number };
  disk: { available: number; total: number } | null;
  database: boolean;
  languageServer: boolean;
}

/** Fetches and displays operational checks without delaying dashboard rendering. */
export function HealthCard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetch("/api/health", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Health checks could not be loaded.");
        return await response.json() as Health;
      })
      .then((nextHealth) => active && setHealth(nextHealth))
      .catch((nextError: unknown) => active && setError(nextError instanceof Error ? nextError.message : "Health checks could not be loaded."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [refreshKey]);

  return (
    <Card
      title={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><MonitorHeartOutlinedIcon />Health</Box>}
      headingLevel="h2"
      action={<Button size="small" onClick={() => setRefreshKey((key) => key + 1)} disabled={hydrated && loading}>Refresh</Button>}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      contentSx={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      {error ? <Typography variant="body2" color="error">{error}</Typography> : null}
      {health ? (
        <>
          <Stack spacing={1.5}>
            <HealthRow label="RAM" value={`${formatBytes(health.memory.used)} / ${formatBytes(health.memory.total)}`} />
            <HealthRow label="Storage" value={health.disk ? `${formatBytes(health.disk.total - health.disk.available)} / ${formatBytes(health.disk.total)}` : "Unavailable"} />
            <HealthRow label="Database" value={<StatusChip available={health.database} />} />
            <HealthRow label="Language server" value={<StatusChip available={health.languageServer} />} />
          </Stack>
          <Typography sx={{ mt: "auto", alignSelf: "flex-end" }} variant="caption" color="text.secondary">
            Checked {new Date(health.checkedAt).toLocaleTimeString("de-DE")}
          </Typography>
        </>
      ) : loading ? <Typography variant="body2" color="text.secondary">Checking services…</Typography> : null}
    </Card>
  );
}

function HealthRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Box sx={{ textAlign: "right" }}>{value}</Box>
    </Box>
  );
}

function StatusChip({ available }: { available: boolean }) {
  return <Chip color={available ? "success" : "error"} label={available ? "Available" : "Unavailable"} size="small" />;
}

function formatBytes(value: number): string {
  const gigabyte = 1024 ** 3;
  return value >= gigabyte ? `${(value / gigabyte).toFixed(1)} GB` : `${Math.round(value / 1024 ** 2)} MB`;
}
