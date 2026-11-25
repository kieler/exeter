import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import TabletOutlinedIcon from "@mui/icons-material/TabletOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SessionClient } from "@/lib/sessions";
import type { ReactNode } from "react";

export interface SessionClientDisplayProps {
  client: SessionClient | null;
  showLabels?: boolean;
}

/** Renders the recorded client as compact icons or icon-and-text metadata. */
export function SessionClientDisplay({
  client,
  showLabels = false,
}: SessionClientDisplayProps) {
  if (!client) {
    return <Typography component="span" variant="body2" color="text.secondary">Unknown</Typography>;
  }

  return (
    <Box component="span" sx={{ display: "inline-flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
      <ClientValue
        icon={<DeviceCategoryIcon device={client.device} />}
        value={formatDevice(client)}
        showLabel={showLabels}
      />
      <ClientValue
        icon={<BrowserIcon {...client.browser} />}
        value={formatSoftware(client.browser)}
        showLabel={showLabels}
      />
      <ClientValue
        icon={<OperatingSystemIcon {...client.operatingSystem} />}
        value={formatSoftware(client.operatingSystem)}
        showLabel={showLabels}
      />
    </Box>
  );
}

/** Renders an operating-system logo with its parser value as a native tooltip. */
export function OperatingSystemIcon({ name, version }: SessionClient["operatingSystem"]) {
  return <ClientIcon icon={<ComputerOutlinedIcon fontSize="small" />} title={formatSoftware({ name, version })} />;
}

/** Renders a browser logo with its parser value as a native tooltip. */
export function BrowserIcon({ name, version }: SessionClient["browser"]) {
  return <ClientIcon icon={<LanguageOutlinedIcon fontSize="small" />} title={formatSoftware({ name, version })} />;
}

/** Renders a device-category icon with its category as a native tooltip. */
export function DeviceCategoryIcon({ device }: { device: SessionClient["device"] }) {
  return <ClientIcon icon={deviceCategoryIcon(device.category)} title={formatDeviceTooltip(device)} />;
}

function ClientValue({
  icon,
  value,
  showLabel,
}: {
  icon: ReactNode;
  value: string;
  showLabel: boolean;
}) {
  return (
    <Box component="span" sx={{ display: "inline-flex", gap: 0.75, alignItems: "center" }}>
      {icon}
      {showLabel ? <Typography component="span" variant="body2">{value}</Typography> : null}
    </Box>
  );
}

function ClientIcon({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <Box component="span" title={title} sx={{ display: "inline-flex" }}>{icon}</Box>
  );
}

function deviceCategoryIcon(category: SessionClient["device"]["category"]): ReactNode {
  switch (category) {
    case "mobile":
      return <PhoneAndroidOutlinedIcon fontSize="small" />;
    case "tablet":
      return <TabletOutlinedIcon fontSize="small" />;
    case "desktop":
      return <ComputerOutlinedIcon fontSize="small" />;
    default:
      return <HelpOutlineIcon fontSize="small" />;
  }
}

function formatDevice(client: SessionClient): string {
  return [client.device.vendor, client.device.model].filter(Boolean).join(" ") || client.device.category;
}

function formatSoftware(software: SessionClient["browser"]): string {
  return [software.name, software.version].filter(Boolean).join(" ") || "Unknown";
}

function formatDeviceTooltip(device: SessionClient["device"]): string {
  const reportedDevice = [device.reportedType, device.vendor, device.model]
    .filter(Boolean)
    .join(", ");

  return reportedDevice
    ? `${device.category} (${reportedDevice})`
    : `${device.category} (no device type reported by UA parser)`;
}
