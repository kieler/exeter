import type { ScalarMetric } from "./types";

export function formatScalarMetric(m: ScalarMetric): string {
  if (m.type === "milliseconds") {
    const totalSeconds = Math.round(m.value / 1_000);
    const hours = Math.floor(totalSeconds / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];

    if (hours) {
      parts.push(`${hours} h`);
    }

    if (minutes || hours) {
      parts.push(`${minutes} min`);
    }

    parts.push(`${seconds} s`);
    return parts.join(" ");
  }

  throw new Error("Unknown ScalarMetric type: " + m.type);
}
