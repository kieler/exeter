"use client";

import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { useEffect, useState } from "react";

/** Mounts the MUI chart only in the browser to avoid server/client chart markup drift. */
export function SessionsByDayChart({ labels, values }: { labels: string[]; values: number[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Box sx={{ height: 360 }} />;

  return (
    <BarChart
      height={360}
      grid={{ horizontal: true }}
      margin={{ bottom: 64, left: 48, right: 24, top: 24 }}
      series={[{ data: values, label: "Sessions" }]}
      xAxis={[{ data: labels, scaleType: "band" }]}
    />
  );
}
