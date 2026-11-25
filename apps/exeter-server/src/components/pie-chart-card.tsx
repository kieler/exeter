"use client";

import Typography from "@mui/material/Typography";
import { PieChart } from "@mui/x-charts/PieChart";
import { Card } from "./card";

export interface PieChartDatum {
  name: string;
  value: number;
}

export interface PieChartCardProps {
  title: string;
  description?: string;
  data: readonly PieChartDatum[];
}

/**
 * Renders categorical numeric data as an SVG pie chart inside a titled card.
 */
export function PieChartCard({ title, description, data }: PieChartCardProps) {
  return (
    <Card title={title} description={description}>
      {data.length ? (
        <PieChart
          height={288}
          hideLegend={false}
          series={[{
            data: data.map((item, id) => ({ id, label: item.name, value: item.value })),
            innerRadius: 45,
          }]}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">No data recorded.</Typography>
      )}
    </Card>
  );
}
