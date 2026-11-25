import { UAParser } from "ua-parser-js";
import type { SessionClient, SessionClientDevice } from "./session-repository";

/** Converts a stored user-agent header into the stable client shape used by session views. */
export function parseSessionUserAgent(userAgent: string | null): SessionClient | null {
  if (!userAgent) {
    return null;
  }

  const parsed = UAParser(userAgent);

  return {
    browser: {
      name: parsed.browser.name ?? null,
      version: parsed.browser.version ?? null,
    },
    operatingSystem: {
      name: parsed.os.name ?? null,
      version: parsed.os.version ?? null,
    },
    device: {
      category: resolveDeviceCategory(parsed.device.type),
      reportedType: parsed.device.type ?? null,
      vendor: parsed.device.vendor ?? null,
      model: parsed.device.model ?? null,
    },
  };
}

function resolveDeviceCategory(deviceType: string | undefined): SessionClientDevice["category"] {
  if (deviceType === "mobile" || deviceType === "tablet") {
    return deviceType;
  }

  return deviceType ? "other" : "desktop";
}
